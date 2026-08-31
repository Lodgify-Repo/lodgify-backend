import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { PaystackService } from './paystack.service';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let paystackService: PaystackService;

  const mockPrisma = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      return cb(mockPrisma);
    }),
  };

  const mockPaystackService = {
    initializePayment: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaystackService, useValue: mockPaystackService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    paystackService = module.get<PaystackService>(PaystackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiatePayment', () => {
    it('should initiate payment', async () => {
      mockPrisma.payment.create.mockResolvedValue({ id: 'p1', reference: 'REF' });
      mockPaystackService.initializePayment.mockResolvedValue({ authorization_url: 'http://paystack' });

      const result = await service.initiatePayment({ bookingId: 'b1', amount: 100, email: 'test@test.com' } as any, 'u1');
      expect(result.payment.id).toBe('p1');
      expect(result.authorizationUrl).toBe('http://paystack');
    });
  });

  describe('verifyWebhook', () => {
    it('should verify and update successful payment', async () => {
      mockPaystackService.verifyWebhookSignature.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'p1', bookingId: 'b1', amount: 100, status: 'PENDING' });

      await service.verifyWebhook(JSON.stringify({
        event: 'charge.success',
        data: { reference: 'REF' }
      }), 'sig');

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { reference: 'REF' },
        data: { status: 'SUCCESS', gatewayResponse: { reference: 'REF' } }
      });
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: 'CONFIRMED' }
      });
      expect(EventBus.emit).toHaveBeenCalledWith('payment:received', expect.any(Object), 'PaymentsService');
    });

    it('should throw if signature invalid', async () => {
      mockPaystackService.verifyWebhookSignature.mockReturnValue(false);
      await expect(service.verifyWebhook('{}', 'sig')).rejects.toThrow('Invalid webhook signature');
    });

    it('should skip if already SUCCESS', async () => {
      mockPaystackService.verifyWebhookSignature.mockReturnValue(true);
      mockPrisma.payment.findUnique.mockResolvedValue({ status: 'SUCCESS' });
      
      await service.verifyWebhook(JSON.stringify({
        event: 'charge.success',
        data: { reference: 'REF' }
      }), 'sig');

      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });
  });
});
