import { Test, TestingModule } from '@nestjs/testing';
import { PropertyReviewsService } from './property-reviews.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PropertyReviewsService', () => {
  let service: PropertyReviewsService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    propertyBooking: {
      findUnique: jest.fn(),
    },
    propertyReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyReviewsService>(PropertyReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    it('should create review', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.propertyBooking.findUnique.mockResolvedValue({ id: 'b1', guestId: 'guest1', propertyId: 'p1' });
      mockPrisma.propertyReview.create.mockResolvedValue({ id: 'rev1' });
      mockPrisma.propertyReview.findMany.mockResolvedValue([{ overallRating: 5 }]);
      mockPrisma.property.update.mockResolvedValue({ id: 'p1' });

      const result = await service.createReview('p1', 'guest1', {
        bookingId: 'b1',
        cleanliness: 5,
        accuracy: 5,
        checkIn: 5,
        communication: 5,
        location: 5,
        value: 5,
        comment: 'Great',
      });

      expect(result.id).toBe('rev1');
    });

    it('should throw if invalid booking', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.propertyBooking.findUnique.mockResolvedValue({ id: 'b1', guestId: 'otherGuest', propertyId: 'p1' });

      await expect(service.createReview('p1', 'guest1', {
        bookingId: 'b1',
        cleanliness: 5,
        accuracy: 5,
        checkIn: 5,
        communication: 5,
        location: 5,
        value: 5,
        comment: 'Great',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('respondToReview', () => {
    it('should respond to review', async () => {
      mockPrisma.propertyReview.findUnique.mockResolvedValue({ id: 'rev1', property: { ownerId: 'owner1' } });
      mockPrisma.propertyReview.update.mockResolvedValue({ id: 'rev1', ownerResponse: 'Thanks' });

      const result = await service.respondToReview('rev1', 'owner1', { response: 'Thanks' });
      expect(result.ownerResponse).toBe('Thanks');
    });
  });

  describe('getPropertyReviews', () => {
    it('should return aggregated reviews', async () => {
      mockPrisma.propertyReview.findMany.mockResolvedValue([
        { cleanliness: 5, accuracy: 5, checkIn: 5, communication: 5, location: 5, value: 5, overallRating: 5 },
        { cleanliness: 4, accuracy: 4, checkIn: 4, communication: 4, location: 4, value: 4, overallRating: 4 },
      ]);

      const result = await service.getPropertyReviews('p1');
      expect(result.totalReviews).toBe(2);
      expect(result.averageRating).toBe(4.5);
    });
  });
});
