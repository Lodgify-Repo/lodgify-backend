import { Test, TestingModule } from '@nestjs/testing';
import { PropertyBookingsController } from './property-bookings.controller';
import { PropertyBookingsService } from '../services/property-bookings.service';

describe('PropertyBookingsController', () => {
  let controller: PropertyBookingsController;
  let bookingsService: PropertyBookingsService;

  const mockBookingsService = {
    calculateQuote: jest.fn(),
    createBooking: jest.fn(),
    getGuestBookings: jest.fn(),
    getOwnerBookings: jest.fn(),
    reviewBookingRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyBookingsController],
      providers: [
        { provide: PropertyBookingsService, useValue: mockBookingsService },
      ],
    }).compile();

    controller = module.get<PropertyBookingsController>(PropertyBookingsController);
    bookingsService = module.get<PropertyBookingsService>(PropertyBookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('calculateQuote', () => {
    it('should return quote', async () => {
      mockBookingsService.calculateQuote.mockResolvedValue({ totalAmount: 100 });
      const result = await controller.calculateQuote('1', {} as any);
      expect(result.totalAmount).toBe(100);
    });
  });

  describe('createBooking', () => {
    it('should create booking', async () => {
      mockBookingsService.createBooking.mockResolvedValue({ id: '1' });
      const result = await controller.createBooking({ user: { id: 'u1' } } as any, '1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getGuestBookings', () => {
    it('should get guest bookings', async () => {
      mockBookingsService.getGuestBookings.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getGuestBookings({ user: { id: 'u1' } } as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('getOwnerBookings', () => {
    it('should get owner bookings', async () => {
      mockBookingsService.getOwnerBookings.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getOwnerBookings({ user: { id: 'u1' } } as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('reviewBookingRequest', () => {
    it('should review booking', async () => {
      mockBookingsService.reviewBookingRequest.mockResolvedValue({ id: '1', status: 'ACCEPTED' });
      const result = await controller.reviewBookingRequest({ user: { id: 'u1' } } as any, '1', {} as any);
      expect(result.status).toBe('ACCEPTED');
    });
  });
});
