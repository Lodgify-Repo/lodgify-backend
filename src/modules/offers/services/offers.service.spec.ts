import { Test, TestingModule } from '@nestjs/testing';
import { OffersService } from './offers.service';
import { PrismaService } from '@/infra/database/prisma.service';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('OffersService', () => {
  let service: OffersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    property: { findUnique: jest.fn(), update: jest.fn() },
    purchaseOffer: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    propertySaleDocument: { create: jest.fn(), findMany: jest.fn() },
    buyerSavedSearch: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    saleTransactionMilestone: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase offer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@test.com' });
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', salesPipelineStatus: 'LISTED' });
      mockPrisma.property.update.mockResolvedValue({});
      mockPrisma.purchaseOffer.findFirst.mockResolvedValue(null);
      mockPrisma.purchaseOffer.create.mockResolvedValue({ id: 'o1', propertyId: 'p1' });

      const result = await service.create('u1', { propertyId: 'p1', amount: 100000 });
      expect(result.id).toBe('o1');
      expect(EventBus.emit).toHaveBeenCalledWith('offer:received', expect.any(Object), 'OffersService');
    });
  });

  describe('reviewOffer', () => {
    it('should accept offer', async () => {
      mockPrisma.purchaseOffer.findUnique.mockResolvedValue({ id: 'o1', propertyId: 'p1', property: { ownerId: 'owner1' } });
      mockPrisma.purchaseOffer.update.mockResolvedValue({ id: 'o1', status: 'ACCEPTED' });
      mockPrisma.property.update.mockResolvedValue({});
      mockPrisma.saleTransactionMilestone.findFirst.mockResolvedValue(null);

      const result = await service.reviewOffer('o1', 'owner1', { decision: 'ACCEPT' });
      expect(result.status).toBe('ACCEPTED');
    });
  });

  describe('getMyOffers', () => {
    it('should return offers for user', async () => {
      mockPrisma.purchaseOffer.findMany.mockResolvedValue([{ id: 'o1' }]);
      const result = await service.getMyOffers('u1');
      expect(result).toHaveLength(1);
    });
  });
});
