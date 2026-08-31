import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from '../services/bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: BookingsService;

  const mockBookingsService = {
    create: jest.fn(),
    findByGuest: jest.fn(),
    findByBranch: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create booking', async () => {
      mockBookingsService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create({ user: { id: 'u1' } } as any, {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getMyBookings', () => {
    it('should return my bookings', async () => {
      mockBookingsService.findByGuest.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getMyBookings({ user: { id: 'u1' } } as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('getBranchBookings', () => {
    it('should return branch bookings', async () => {
      mockBookingsService.findByBranch.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getBranchBookings('b1');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      mockBookingsService.updateStatus.mockResolvedValue({ id: '1', status: 'CONFIRMED' });
      const result = await controller.updateStatus('1', { status: 'CONFIRMED' } as any);
      expect(result.status).toBe('CONFIRMED');
    });
  });
});
