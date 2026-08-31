import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../services/admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getAllUsers: jest.fn(),
    updateUserStatus: jest.fn(),
    getPendingAgents: jest.fn(),
    verifyAgent: jest.fn(),
    getPendingHotels: jest.fn(),
    getHotelForReview: jest.fn(),
    verifyHotel: jest.fn(),
    getSystemLogs: jest.fn(),
    clearAuditLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      mockAdminService.getAllUsers.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getAllUsers();
      expect(result).toHaveLength(1);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      mockAdminService.updateUserStatus.mockResolvedValue({ id: '1', isActive: true });
      const result = await controller.updateUserStatus('1', { status: 'ACTIVE' });
      expect(result.isActive).toBe(true);
    });
  });

  describe('getPendingAgents', () => {
    it('should return pending agents', async () => {
      mockAdminService.getPendingAgents.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getPendingAgents();
      expect(result).toHaveLength(1);
    });
  });

  describe('verifyAgent', () => {
    it('should verify agent', async () => {
      mockAdminService.verifyAgent.mockResolvedValue({ id: '1', status: 'VERIFIED' });
      const result = await controller.verifyAgent('1', { status: 'VERIFIED' });
      expect(result.status).toBe('VERIFIED');
    });
  });

  describe('getPendingHotels', () => {
    it('should return pending hotels', async () => {
      mockAdminService.getPendingHotels.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getPendingHotels();
      expect(result).toHaveLength(1);
    });
  });

  describe('verifyHotel', () => {
    it('should verify hotel', async () => {
      const req = { user: { id: 'admin-1' } };
      mockAdminService.verifyHotel.mockResolvedValue({ id: '1', status: 'ACTIVE' });
      const result = await controller.verifyHotel('1', { status: 'APPROVED' }, req);
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('getSystemLogs', () => {
    it('should return system logs', async () => {
      mockAdminService.getSystemLogs.mockResolvedValue({ data: [] });
      const result = await controller.getSystemLogs({});
      expect(result.data).toBeDefined();
    });
  });
});
