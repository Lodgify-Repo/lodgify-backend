import { Test, TestingModule } from '@nestjs/testing';
import { PropertyBookingsService } from './property-bookings.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { PropertyPricingService } from './property-pricing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('PropertyBookingsService', () => {
  let service: PropertyBookingsService;
  let prisma: PrismaService;
  let pricingService: PropertyPricingService;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    propertyBooking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    propertyBlockedDate: {
      findFirst: jest.fn(),
    },
  };

  const mockPricingService = {
    calculateNightlyBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyBookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyPricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<PropertyBookingsService>(PropertyBookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    pricingService = module.get<PropertyPricingService>(PropertyPricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateQuote', () => {
    it('should calculate quote', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p1',
        minStayNights: 1,
        maxGuests: 4,
        baseGuests: 2,
        additionalGuestFee: 10,
        cleaningFee: 50,
        securityDeposit: 100,
        currency: 'USD',
      });
      mockPrisma.propertyBooking.findFirst.mockResolvedValue(null);
      mockPrisma.propertyBlockedDate.findFirst.mockResolvedValue(null);
      mockPricingService.calculateNightlyBreakdown.mockResolvedValue({
        totalBaseAmount: 200,
        baseNightlyRate: 100,
        averageNightlyRate: 100,
      });

      const result = await service.calculateQuote('p1', {
        checkInDate: '2025-01-01',
        checkOutDate: '2025-01-03', // 2 nights
        guestsCount: 3,
      } as any);

      expect(result.nights).toBe(2);
      expect(result.extraGuestsFee).toBe(20); // (3-2) * 10 * 2
      expect(result.totalAmount).toBe(370); // 200 + 50 + 100 + 20
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.calculateQuote('p1', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw if conflict exists', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ minStayNights: 1, maxGuests: 4 });
      mockPrisma.propertyBooking.findFirst.mockResolvedValue({ id: 'b1' });

      await expect(service.calculateQuote('p1', {
        checkInDate: '2025-01-01',
        checkOutDate: '2025-01-03',
        guestsCount: 2,
      } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking', () => {
    it('should create booking', async () => {
      // Mock quote calculation internally indirectly via prisma
      jest.spyOn(service, 'calculateQuote').mockResolvedValue({
        nights: 2,
        currency: 'USD',
        totalAmount: 370,
        securityDeposit: 100,
      } as any);

      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p1',
        instantBookable: true,
        houseRules: [],
        owner: { firstName: 'John', lastName: 'Doe' },
      });

      mockPrisma.propertyBooking.create.mockResolvedValue({ id: 'b1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'p1' });

      const result = await service.createBooking('p1', 'guest1', {
        checkInDate: '2025-01-01',
        checkOutDate: '2025-01-03',
        guestsCount: 2,
      } as any);

      expect(result.id).toBe('b1');
      expect(EventBus.emit).toHaveBeenCalledWith(
        'property_booking:created',
        expect.any(Object),
        'PropertyBookingsService'
      );
    });
  });

  describe('reviewBookingRequest', () => {
    it('should accept booking', async () => {
      mockPrisma.propertyBooking.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'PENDING',
        property: { ownerId: 'owner1' },
      });
      mockPrisma.propertyBooking.update.mockResolvedValue({ id: 'b1', status: 'ACCEPTED' });

      const result = await service.reviewBookingRequest('b1', 'owner1', { action: 'ACCEPT' } as any);
      expect(result.status).toBe('ACCEPTED');
      expect(EventBus.emit).toHaveBeenCalledWith(
        'property_booking:accepted',
        expect.any(Object),
        'PropertyBookingsService'
      );
    });
  });
});
