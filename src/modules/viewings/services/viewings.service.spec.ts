import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsService } from './viewings.service';
import { PrismaService } from '@/infra/database/prisma.service';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('ViewingsService', () => {
  let service: ViewingsService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    viewingAppointment: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ViewingsService>(ViewingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('schedule', () => {
    it('should schedule viewing', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'John' });
      mockPrisma.viewingAppointment.findFirst.mockResolvedValue(null);
      mockPrisma.viewingAppointment.create.mockResolvedValue({ id: 'v1' });

      const date = new Date(Date.now() + 86400000); // tomorrow
      const result = await service.schedule('u1', { propertyId: 'p1', date: date.toISOString(), viewingType: 'PRIVATE_SHOWING' } as any);
      
      expect(result.id).toBe('v1');
      expect(EventBus.emit).toHaveBeenCalledWith('property:viewing_requested', expect.any(Object), 'ViewingsService');
    });

    it('should throw if date in past', async () => {
      const date = new Date(Date.now() - 1000);
      await expect(service.schedule('u1', { propertyId: 'p1', date: date.toISOString() } as any)).rejects.toThrow('Viewing date must be in the future');
    });
  });

  describe('getMyViewings', () => {
    it('should return viewings', async () => {
      mockPrisma.viewingAppointment.findMany.mockResolvedValue([{ id: 'v1' }]);
      const result = await service.getMyViewings('u1');
      expect(result).toHaveLength(1);
    });
  });
});
