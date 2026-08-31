import { Test, TestingModule } from '@nestjs/testing';
import { PropertyCalendarController } from './property-calendar.controller';
import { PropertyCalendarService } from '../services/property-calendar.service';

describe('PropertyCalendarController', () => {
  let controller: PropertyCalendarController;
  let calendarService: PropertyCalendarService;

  const mockCalendarService = {
    getAvailabilityCalendar: jest.fn(),
    blockDates: jest.fn(),
    unblockDates: jest.fn(),
    generateICalStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyCalendarController],
      providers: [
        { provide: PropertyCalendarService, useValue: mockCalendarService },
      ],
    }).compile();

    controller = module.get<PropertyCalendarController>(PropertyCalendarController);
    calendarService = module.get<PropertyCalendarService>(PropertyCalendarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailability', () => {
    it('should return availability', async () => {
      mockCalendarService.getAvailabilityCalendar.mockResolvedValue({ bookedRanges: [] });
      const result = await controller.getAvailability('1');
      expect(result.bookedRanges).toBeDefined();
    });
  });

  describe('blockDates', () => {
    it('should block dates', async () => {
      mockCalendarService.blockDates.mockResolvedValue({ id: 'blk1' });
      const result = await controller.blockDates({ user: { id: 'owner1' } } as any, '1', {} as any);
      expect(result.id).toBe('blk1');
    });
  });

  describe('unblockDates', () => {
    it('should unblock dates', async () => {
      mockCalendarService.unblockDates.mockResolvedValue({ id: 'blk1' });
      const result = await controller.unblockDates({ user: { id: 'owner1' } } as any, 'blk1');
      expect(result.id).toBe('blk1');
    });
  });

  describe('exportICal', () => {
    it('should export ical', async () => {
      mockCalendarService.generateICalStream.mockResolvedValue('ICAL_DATA');
      const mockRes = { send: jest.fn() };
      await controller.exportICal('1', mockRes);
      expect(mockRes.send).toHaveBeenCalledWith('ICAL_DATA');
    });
  });
});
