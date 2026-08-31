import { Test, TestingModule } from '@nestjs/testing';
import { PropertyCalendarService } from './property-calendar.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PropertyCalendarService', () => {
  let service: PropertyCalendarService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyBooking: {
      findMany: jest.fn(),
    },
    propertyBlockedDate: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyCalendarService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyCalendarService>(PropertyCalendarService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailabilityCalendar', () => {
    it('should return availability calendar', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: '1', minStayNights: 2, instantBookable: true });
      mockPrisma.propertyBooking.findMany.mockResolvedValue([
        { id: 'b1', checkInDate: new Date(), checkOutDate: new Date(), status: 'ACCEPTED' }
      ]);
      mockPrisma.propertyBlockedDate.findMany.mockResolvedValue([
        { id: 'blk1', startDate: new Date(), endDate: new Date(), reason: 'Maintenance', source: 'MANUAL' }
      ]);

      const result = await service.getAvailabilityCalendar('1');
      expect(result.propertyId).toBe('1');
      expect(result.bookedRanges).toHaveLength(1);
      expect(result.blockedRanges).toHaveLength(1);
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.getAvailabilityCalendar('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('blockDates', () => {
    it('should block dates', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: '1', ownerId: 'owner1' });
      mockPrisma.propertyBlockedDate.create.mockResolvedValue({ id: 'blk1' });

      const result = await service.blockDates('1', 'owner1', { startDate: '2025-01-01', endDate: '2025-01-05' });
      expect(result.id).toBe('blk1');
    });

    it('should throw if end date is before start date', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: '1', ownerId: 'owner1' });
      await expect(service.blockDates('1', 'owner1', { startDate: '2025-01-05', endDate: '2025-01-01' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('unblockDates', () => {
    it('should unblock dates', async () => {
      mockPrisma.propertyBlockedDate.findUnique.mockResolvedValue({ id: 'blk1', property: { ownerId: 'owner1' } });
      mockPrisma.propertyBlockedDate.delete.mockResolvedValue({ id: 'blk1' });

      const result = await service.unblockDates('blk1', 'owner1');
      expect(result.id).toBe('blk1');
    });
  });

  describe('generateICalStream', () => {
    it('should generate ical stream', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test Prop',
        bookings: [
          { id: 'b1', checkInDate: new Date('2025-01-01'), checkOutDate: new Date('2025-01-05'), status: 'ACCEPTED' }
        ],
        blockedDates: [
          { id: 'blk1', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-05'), reason: 'Maint' }
        ]
      });

      const result = await service.generateICalStream('1');
      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('SUMMARY:Reserved - Booking #b1');
      expect(result).toContain('SUMMARY:Blocked - Maint');
    });
  });
});
