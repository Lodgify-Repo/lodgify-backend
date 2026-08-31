import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMarketplaceService } from './property-marketplace.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PropertyMarketplaceService', () => {
  let service: PropertyMarketplaceService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyMarketplaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyMarketplaceService>(PropertyMarketplaceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchMarketplace', () => {
    it('should search marketplace', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{ id: '1', images: [], owner: {} }]);
      mockPrisma.property.count.mockResolvedValue(1);

      const result = await service.searchMarketplace({ page: 1, limit: 10 } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should handle geo search', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{ id: '1', latitude: 10, longitude: 20, images: [], owner: {} }]);
      
      const result = await service.searchMarketplace({ latitude: 10, longitude: 20, radius: 50 } as any);
      expect(result.data).toBeDefined();
    });
  });

  describe('getMapPins', () => {
    it('should return map pins', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{ id: '1', latitude: 10, longitude: 20, images: [] }]);
      
      const result = await service.getMapPins({});
      expect(result.pins).toHaveLength(1);
    });
  });

  describe('getSimilarProperties', () => {
    it('should return similar properties', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: '1', city: 'Test City', state: 'TS', type: 'APARTMENT', listingType: 'SHORT_TERM_RENT', price: 100, amenities: [] });
      mockPrisma.property.findMany.mockResolvedValue([
        { id: '2', city: 'Test City', state: 'TS', type: 'APARTMENT', listingType: 'SHORT_TERM_RENT', price: 105, amenities: [], images: [] }
      ]);

      const result = await service.getSimilarProperties('1', 4);
      expect(result).toHaveLength(1);
      expect(result[0].similarityScore).toBeGreaterThan(0);
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.getSimilarProperties('1')).rejects.toThrow(NotFoundException);
    });
  });
});
