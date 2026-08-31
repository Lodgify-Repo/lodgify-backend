import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CacheService } from '@/infra/cache/cache.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockPrisma = {
    hotel: { findMany: jest.fn() },
    branch: { findMany: jest.fn(), count: jest.fn() },
    property: { findMany: jest.fn(), count: jest.fn() },
    booking: { findMany: jest.fn() },
  };

  const mockCache = {
    getOrSet: jest.fn((key, ttl, cb) => cb()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autocomplete', () => {
    it('should return autocomplete results', async () => {
      mockPrisma.hotel.findMany.mockResolvedValue([{ id: 'h1', name: 'Hotel 1' }]);
      mockPrisma.branch.findMany.mockResolvedValue([{ city: 'City', state: 'State' }]);
      mockPrisma.property.findMany.mockResolvedValue([{ id: 'p1', title: 'Property', type: 'HOUSE' }]);

      const result = await service.autocomplete({ query: 'test' });
      expect(result.data).toHaveLength(3);
    });

    it('should return empty if query too short', async () => {
      const result = await service.autocomplete({ query: 't' });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('searchHotels', () => {
    it('should search hotels', async () => {
      mockPrisma.branch.findMany.mockResolvedValue([
        {
          id: 'b1',
          roomTypes: [
            {
              id: 'rt1',
              basePrice: 100,
              pricingRules: [],
              rooms: [{ id: 'r1' }],
            },
          ],
        },
      ]);
      mockPrisma.branch.count.mockResolvedValue(1);

      const result = await service.searchHotels({ query: 'test' });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('searchProperties', () => {
    it('should search properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{ id: 'p1', price: 200000 }]);
      mockPrisma.property.count.mockResolvedValue(1);

      const result = await service.searchProperties({ query: 'test' });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
