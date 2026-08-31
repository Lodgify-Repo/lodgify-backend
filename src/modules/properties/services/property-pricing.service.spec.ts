import { Test, TestingModule } from '@nestjs/testing';
import { PropertyPricingService } from './property-pricing.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('PropertyPricingService', () => {
  let service: PropertyPricingService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyPricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyPricingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyPricingService>(PropertyPricingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPricingRule', () => {
    it('should create pricing rule', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      mockPrisma.propertyPricingRule.create.mockResolvedValue({ id: 'r1' });

      const result = await service.createPricingRule('p1', 'owner1', { name: 'Holiday', type: 'SEASONAL', modifierType: 'PERCENTAGE', modifierValue: 20 });
      expect(result.id).toBe('r1');
    });
  });

  describe('getPricingRules', () => {
    it('should return pricing rules', async () => {
      mockPrisma.propertyPricingRule.findMany.mockResolvedValue([{ id: 'r1' }]);
      const result = await service.getPricingRules('p1');
      expect(result).toHaveLength(1);
    });
  });

  describe('deletePricingRule', () => {
    it('should delete pricing rule', async () => {
      mockPrisma.propertyPricingRule.findUnique.mockResolvedValue({ id: 'r1', property: { ownerId: 'owner1' } });
      mockPrisma.propertyPricingRule.delete.mockResolvedValue({ id: 'r1' });

      const result = await service.deletePricingRule('r1', 'owner1');
      expect(result.id).toBe('r1');
    });
  });

  describe('calculateNightlyBreakdown', () => {
    it('should calculate nightly breakdown', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p1',
        nightlyRate: 100,
        pricingRules: [
          { type: 'WEEKEND', modifierType: 'PERCENTAGE', modifierValue: 10, name: 'Wknd' }
        ]
      });

      const result = await service.calculateNightlyBreakdown('p1', new Date('2025-01-03'), new Date('2025-01-05')); // Fri, Sat
      expect(result.nights).toBe(2);
      expect(result.dailyRates).toHaveLength(2);
      // Base 100 + 10% = 110 per night * 2 nights = 220
      expect(result.totalBaseAmount).toBeCloseTo(220);
    });
  });
});
