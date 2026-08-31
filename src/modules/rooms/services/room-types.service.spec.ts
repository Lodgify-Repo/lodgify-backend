import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypesService } from './room-types.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';

describe('RoomTypesService', () => {
  let service: RoomTypesService;
  let prisma: PrismaService;

  const mockPrisma = {
    roomType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RoomTypesService>(RoomTypesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create room type', async () => {
      mockPrisma.roomType.create.mockResolvedValue({ id: 'rt-1' });
      const result = await service.create('b1', {} as any);
      expect(result.id).toBe('rt-1');
    });
  });

  describe('findAll', () => {
    it('should return room types for branch', async () => {
      mockPrisma.roomType.findMany.mockResolvedValue([{ id: 'rt-1' }]);
      const result = await service.findAll('b1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return room type', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue({ id: 'rt-1' });
      const result = await service.findOne('rt-1');
      expect(result.id).toBe('rt-1');
    });

    it('should throw if not found', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue(null);
      await expect(service.findOne('rt-1')).rejects.toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('should update room type', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue({ id: 'rt-1' });
      mockPrisma.roomType.update.mockResolvedValue({ id: 'rt-1', name: 'Updated' });

      const result = await service.update('rt-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });

  describe('addPricingRule', () => {
    it('should add pricing rule', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue({ id: 'rt-1' });
      mockPrisma.pricingRule.create.mockResolvedValue({ id: 'pr-1' });

      const result = await service.addPricingRule('rt-1', { startDate: '2025-01-01', endDate: '2025-01-05' } as any);
      expect(result.id).toBe('pr-1');
    });
  });

  describe('calculateDynamicPrice', () => {
    it('should calculate dynamic price with PERCENTAGE and FIXED_AMOUNT rules', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue({ id: 'rt-1', basePrice: 100 });
      mockPrisma.pricingRule.findMany.mockResolvedValue([
        { modifierType: 'PERCENTAGE', modifierValue: 10 },
        { modifierType: 'FIXED_AMOUNT', modifierValue: 20 },
      ]);

      const result = await service.calculateDynamicPrice('rt-1', '2025-01-01');
      expect(result.basePrice).toBe(100);
      expect(result.dynamicPrice).toBe(130); // 100 + 10% (10) + 20 = 130
    });

    it('should return base price if no active rules', async () => {
      mockPrisma.roomType.findUnique.mockResolvedValue({ id: 'rt-1', basePrice: 100 });
      mockPrisma.pricingRule.findMany.mockResolvedValue([]);

      const result = await service.calculateDynamicPrice('rt-1', '2025-01-01');
      expect(result.dynamicPrice).toBe(100);
    });
  });
});
