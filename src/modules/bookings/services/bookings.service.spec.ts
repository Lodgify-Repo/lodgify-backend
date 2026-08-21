import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import { BookingErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

// Mock EventBus
jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
  on: jest.fn(),
}));

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    branch: { findUnique: jest.fn() },
    room: { findUnique: jest.fn() },
    booking: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const guestId = 'guest-1';
    const baseBookingDto = {
      branchId: 'branch-1',
      roomId: 'room-1',
      checkInDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      guestsCount: 2,
    };

    it('should throw INVALID_DATES if check-in is in the past', async () => {
      const pastDto = { ...baseBookingDto, checkInDate: new Date(Date.now() - 1000).toISOString() };
      await expect(service.create(guestId, pastDto)).rejects.toMatchObject({
        code: BookingErrorCodes.INVALID_DATES
      });
    });

    it('should throw BRANCH_NOT_FOUND if branch does not exist', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(guestId, baseBookingDto)).rejects.toMatchObject({
        code: BookingErrorCodes.BRANCH_NOT_FOUND
      });
    });

    it('should throw ROOM_UNAVAILABLE if there is an overlapping booking', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValueOnce({ id: 'branch-1' });
      mockPrismaService.room.findUnique.mockResolvedValueOnce({
        id: 'room-1',
        status: 'AVAILABLE',
        roomType: { branchId: 'branch-1', basePrice: 100, pricingRules: [] },
      });
      mockPrismaService.booking.findFirst.mockResolvedValueOnce({ id: 'existing-booking' }); // Overlap exists

      await expect(service.create(guestId, baseBookingDto)).rejects.toMatchObject({
        code: BookingErrorCodes.ROOM_UNAVAILABLE,
      });
    });

    it('should create a booking and calculate price correctly without rules', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValueOnce({ id: 'branch-1' });
      mockPrismaService.room.findUnique.mockResolvedValueOnce({
        id: 'room-1',
        status: 'AVAILABLE',
        roomType: { branchId: 'branch-1', basePrice: 100, pricingRules: [] },
      });
      mockPrismaService.booking.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.booking.create.mockResolvedValueOnce({ id: 'new-booking' });

      await service.create(guestId, baseBookingDto);

      expect(mockPrismaService.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 200, // 2 nights * 100
          }),
        }),
      );
      expect(EventBus.emit).toHaveBeenCalledWith('booking:confirmed', expect.any(Object), 'BookingsService');
    });

    it('should calculate price with percentage pricing rules correctly', async () => {
      mockPrismaService.branch.findUnique.mockResolvedValueOnce({ id: 'branch-1' });
      mockPrismaService.room.findUnique.mockResolvedValueOnce({
        id: 'room-1',
        status: 'AVAILABLE',
        roomType: {
          branchId: 'branch-1',
          basePrice: 100,
          pricingRules: [
            {
              modifierType: 'PERCENTAGE',
              modifierValue: 10, // 10% surge
              startDate: new Date(Date.now() - 86400000), // Active
              endDate: new Date(Date.now() + 86400000 * 5),
              isActive: true,
            },
          ],
        },
      });
      mockPrismaService.booking.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.booking.create.mockResolvedValueOnce({ id: 'new-booking' });

      await service.create(guestId, baseBookingDto);

      expect(mockPrismaService.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 220, // 2 nights * 100 = 200 + 10% = 220
          }),
        }),
      );
    });
  });
});
