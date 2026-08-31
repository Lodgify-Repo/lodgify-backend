import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { GeocodingService } from '@/infra/geocoding/geocoding.service';
import { DomainError } from '@/common/domain/error';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: PrismaService;
  let geocodingService: GeocodingService;

  const mockPrisma = {
    branch: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGeocoding = {
    geocode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeocodingService, useValue: mockGeocoding },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    prisma = module.get<PrismaService>(PrismaService);
    geocodingService = module.get<GeocodingService>(GeocodingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a branch and geocode if coordinates missing', async () => {
      mockGeocoding.geocode.mockResolvedValue({ latitude: 10, longitude: 20 });
      mockPrisma.branch.create.mockResolvedValue({ id: '1', latitude: 10, longitude: 20 });

      const result = await service.create('hotel-1', { address: '123 Test St', city: 'Test City' } as any);
      
      expect(mockGeocoding.geocode).toHaveBeenCalledWith('123 Test St', 'Test City', undefined, undefined);
      expect(result.id).toBe('1');
    });

    it('should skip geocoding if coordinates provided', async () => {
      mockPrisma.branch.create.mockResolvedValue({ id: '1', latitude: 10, longitude: 20 });

      await service.create('hotel-1', { address: '123 Test St', latitude: 10, longitude: 20 } as any);
      
      expect(mockGeocoding.geocode).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return branches for hotel', async () => {
      mockPrisma.branch.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll('hotel-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return branch', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1');
      expect(result.id).toBe('1');
    });

    it('should throw if not found or deleted', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(DomainError);

      mockPrisma.branch.findUnique.mockResolvedValue({ id: '1', deletedAt: new Date() });
      await expect(service.findOne('1')).rejects.toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('should re-geocode if address changed', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({ id: '1', address: 'Old St' });
      mockGeocoding.geocode.mockResolvedValue({ latitude: 30, longitude: 40 });
      mockPrisma.branch.update.mockResolvedValue({ id: '1' });

      await service.update('1', { address: 'New St' } as any);
      
      expect(mockGeocoding.geocode).toHaveBeenCalledWith('New St', undefined, undefined, undefined);
    });
  });

  describe('deactivate', () => {
    it('should deactivate branch', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' });
      mockPrisma.branch.update.mockResolvedValue({ id: '1', status: 'DEACTIVATED' });

      const result = await service.deactivate('1');
      expect(result.status).toBe('DEACTIVATED');
    });
  });

  describe('reactivate', () => {
    it('should reactivate branch', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({ id: '1', status: 'DEACTIVATED' });
      mockPrisma.branch.update.mockResolvedValue({ id: '1', status: 'ACTIVE' });

      const result = await service.reactivate('1');
      expect(result.status).toBe('ACTIVE');
    });
  });
});
