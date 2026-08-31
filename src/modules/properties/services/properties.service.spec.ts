import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prisma: PrismaService;

  const mockPrisma = {
    propertyOwnerProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    property: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    propertyImage: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    propertyReview: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prisma = module.get<PrismaService>(PrismaService);

    Object.defineProperty(service, 'logger', {
      value: { warn: jest.fn() },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create property listing', async () => {
      mockPrisma.propertyOwnerProfile.findUnique.mockResolvedValue({ status: 'VERIFIED' });
      mockPrisma.property.create.mockResolvedValue({ id: 'p1' });

      const result = await service.create({ title: 'Test', listingType: 'SHORT_TERM_RENT', price: 100 } as any, 'owner-1');
      expect(result.id).toBe('p1');
      expect(mockPrisma.property.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return property with rating calculation', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.propertyReview.findMany.mockResolvedValue([
        { cleanliness: 5, accuracy: 5, checkIn: 5, communication: 5, location: 5, value: 5, overallRating: 5 }
      ]);
      mockPrisma.property.update.mockResolvedValue({ id: 'p1' });

      const result = await service.findOne('p1');
      expect(result.id).toBe('p1');
      expect(result.rating).toBe(5);
    });

    it('should throw DomainError if not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.findOne('p1')).rejects.toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('should update property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'p1', title: 'Updated' });

      const result = await service.update('p1', { title: 'Updated' } as any, 'owner-1');
      expect(result.title).toBe('Updated');
    });

    it('should throw if unauthorized', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-2' });
      await expect(service.update('p1', {} as any, 'owner-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOwnerProperties', () => {
    it('should return owner properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        { id: 'p1', images: [], _count: { bookings: 0, inquiries: 0, reviews: 0 } }
      ]);

      const result = await service.getOwnerProperties('owner-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('setListingStatus', () => {
    it('should set status', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'p1', status: 'PAUSED' });

      const result = await service.setListingStatus('p1', 'PAUSED', 'owner-1');
      expect(result.status).toBe('PAUSED');
    });
  });

  describe('remove', () => {
    it('should soft delete', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'p1', status: 'OFFLINE' });

      const result = await service.remove('p1', 'owner-1');
      expect(result.status).toBe('OFFLINE');
    });
  });
});
