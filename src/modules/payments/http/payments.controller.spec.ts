import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../services/payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    initiatePayment: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initiate', () => {
    it('should initiate payment', async () => {
      mockPaymentsService.initiatePayment.mockResolvedValue({ payment: { id: 'p1' } });
      const result = await controller.initiate({ user: { id: 'u1' } } as any, {} as any);
      expect(result.payment.id).toBe('p1');
    });
  });

  describe('webhook', () => {
    it('should process webhook', async () => {
      mockPaymentsService.verifyWebhook.mockResolvedValue(undefined);
      const result = await controller.webhook({ rawBody: Buffer.from('raw') } as any, 'sig');
      expect(result.status).toBe('ok');
      expect(mockPaymentsService.verifyWebhook).toHaveBeenCalledWith('raw', 'sig');
    });
  });
});
