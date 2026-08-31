import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import { AuditLogAction, AuditLogLevel, Role } from '@prisma/client';
import Logger from '@/infra/logger/logger.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agentProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    hotel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock logger inside AdminService
    Object.defineProperty(service, 'logger', {
      value: { error: jest.fn(), info: jest.fn() },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: '1', email: 'user@test.com' }];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.getAllUsers();
      expect(result).toEqual(users);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.user.update.mockResolvedValue({ id: '1', isActive: true });

      const result = await service.updateUserStatus('1', { status: 'ACTIVE' });
      expect(result.isActive).toBe(true);
    });

    it('should throw DomainError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateUserStatus('1', { status: 'ACTIVE' })).rejects.toThrow(DomainError);
    });
  });

  describe('verifyAgent', () => {
    it('should verify agent', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.agentProfile.update.mockResolvedValue({ id: '1', status: 'VERIFIED' });

      const result = await service.verifyAgent('1', { status: 'VERIFIED' });
      expect(result.status).toBe('VERIFIED');
    });
  });

  describe('verifyHotel', () => {
    it('should approve hotel and write audit log', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: '1', name: 'Hotel 1' });
      mockPrisma.hotel.update.mockResolvedValue({ id: '1', status: 'ACTIVE' });

      const result = await service.verifyHotel('1', { status: 'APPROVED' }, 'admin-1');
      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getSystemLogs', () => {
    it('should return audit logs', async () => {
      mockPrisma.$transaction.mockResolvedValue([[{ id: '1' }], 1]);
      
      const result = await service.getSystemLogs({ source: 'audit' });
      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('clearAuditLogs', () => {
    it('should delete old logs', async () => {
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 5 });
      
      const result = await service.clearAuditLogs({ retentionDays: 30 });
      expect(result.deleted).toBe(5);
    });
  });
});
