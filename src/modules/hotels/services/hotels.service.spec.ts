import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';

describe('HotelsService', () => {
  let service: HotelsService;
  let prisma: PrismaService;

  const mockPrisma = {
    hotel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Mock logger
    Object.defineProperty(service, 'logger', {
      value: { info: jest.fn() },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue(null);
      mockPrisma.hotel.create.mockResolvedValue({ id: '1', name: 'Test Hotel', status: 'PENDING' });

      const result = await service.create('owner-1', { name: 'Test Hotel' } as any);
      expect(result.id).toBe('1');
      expect(result.status).toBe('PENDING');
      expect(mockPrisma.hotel.create).toHaveBeenCalled();
    });

    it('should throw if user already owns a hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.create('owner-1', {} as any)).rejects.toThrow(DomainError);
    });
  });

  describe('findByOwner', () => {
    it('should return hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.findByOwner('owner-1');
      expect(result.id).toBe('1');
    });

    it('should throw if hotel not found', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue(null);
      await expect(service.findByOwner('owner-1')).rejects.toThrow(DomainError);
    });
  });

  describe('findById', () => {
    it('should return hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.findById('1');
      expect(result.id).toBe('1');
    });

    it('should throw if hotel not found', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('should update hotel', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: '1' }); // for findByOwner
      mockPrisma.hotel.update.mockResolvedValue({ id: '1', name: 'Updated' });

      const result = await service.update('owner-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });
});
