import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from '../services/rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  let roomsService: RoomsService;

  const mockRoomsService = {
    create: jest.fn(),
    findAllByBranch: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    scheduleMaintenance: jest.fn(),
    getRoomMaintenance: jest.fn(),
    getAvailabilityCalendar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomsService, useValue: mockRoomsService },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    roomsService = module.get<RoomsService>(RoomsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create room', async () => {
      mockRoomsService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create({} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('findAllByBranch', () => {
    it('should find rooms by branch', async () => {
      mockRoomsService.findAllByBranch.mockResolvedValue([{ id: '1' }]);
      const result = await controller.findAllByBranch('b1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update room', async () => {
      mockRoomsService.update.mockResolvedValue({ id: '1' });
      const result = await controller.update('1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('updateStatus', () => {
    it('should update room status', async () => {
      mockRoomsService.updateStatus.mockResolvedValue({ id: '1', status: 'CLEANING' });
      const result = await controller.updateStatus({ user: { id: 'u1' } } as any, '1', {} as any);
      expect(result.status).toBe('CLEANING');
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule maintenance', async () => {
      mockRoomsService.scheduleMaintenance.mockResolvedValue({ id: 'm-1' });
      const result = await controller.scheduleMaintenance('1', {} as any);
      expect(result.id).toBe('m-1');
    });
  });

  describe('getRoomMaintenance', () => {
    it('should get maintenance logs', async () => {
      mockRoomsService.getRoomMaintenance.mockResolvedValue([{ id: 'm-1' }]);
      const result = await controller.getRoomMaintenance('1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAvailabilityCalendar', () => {
    it('should get calendar', async () => {
      mockRoomsService.getAvailabilityCalendar.mockResolvedValue([]);
      const result = await controller.getAvailabilityCalendar('b1', '2025', '2025');
      expect(result).toBeDefined();
    });
  });
});
