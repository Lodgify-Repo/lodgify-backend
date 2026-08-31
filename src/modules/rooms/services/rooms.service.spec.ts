import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  const mockPrisma = {
    room: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    roomMaintenance: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      mockPrisma.room.create.mockResolvedValue({ id: '1', roomNumber: '101' });

      const result = await service.create({ roomTypeId: 'rt-1', roomNumber: '101' } as any);
      expect(result.id).toBe('1');
    });

    it('should throw if room number exists for type', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.create({ roomTypeId: 'rt-1', roomNumber: '101' } as any)).rejects.toThrow(DomainError);
    });
  });

  describe('findAllByBranch', () => {
    it('should return rooms', async () => {
      mockPrisma.room.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAllByBranch('branch-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update room', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.room.update.mockResolvedValue({ id: '1', status: 'AVAILABLE' });

      const result = await service.update('1', { status: 'AVAILABLE' } as any);
      expect(result.status).toBe('AVAILABLE');
    });

    it('should throw if room not found', async () => {
      mockPrisma.room.findUnique.mockResolvedValue(null);
      await expect(service.update('1', {} as any)).rejects.toThrow(DomainError);
    });
  });

  describe('updateStatus', () => {
    it('should update status and emit event if cleaned', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ id: '1', status: 'CLEANING', roomType: { branchId: 'b1' } });
      mockPrisma.room.update.mockResolvedValue({ id: '1', status: 'AVAILABLE' });

      const result = await service.updateStatus('1', { status: 'AVAILABLE' } as any, 'user-1');
      
      expect(result.status).toBe('AVAILABLE');
      expect(EventBus.emit).toHaveBeenCalledWith(
        'room:cleaned',
        expect.objectContaining({ roomId: '1' }),
        'RoomsService'
      );
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule maintenance', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.roomMaintenance.create.mockResolvedValue({ id: 'm-1' });

      const result = await service.scheduleMaintenance('1', { startDate: '2025-01-01', endDate: '2025-01-05', reason: 'Fix' });
      expect(result.id).toBe('m-1');
    });
  });

  describe('getRoomMaintenance', () => {
    it('should return maintenance logs', async () => {
      mockPrisma.roomMaintenance.findMany.mockResolvedValue([{ id: 'm-1' }]);
      const result = await service.getRoomMaintenance('1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAvailabilityCalendar', () => {
    it('should return availability calendar', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: '1',
          roomNumber: '101',
          roomTypeId: 'rt-1',
          roomType: { name: 'Deluxe' },
          status: 'AVAILABLE',
          bookings: [],
          maintenanceBlocks: []
        }
      ]);

      const result = await service.getAvailabilityCalendar('b1', '2025-01-01', '2025-01-31');
      expect(result).toHaveLength(1);
      expect(result[0].roomNumber).toBe('101');
    });
  });
});
