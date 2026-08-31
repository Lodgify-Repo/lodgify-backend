import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    agentProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    agentReview: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create an agent profile and update user role', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue(null);
      mockPrisma.agentProfile.create.mockResolvedValue({ id: '1', userId: 'user-1' });

      const result = await service.createProfile('user-1', {
        accountType: 'INDIVIDUAL',
      } as any);

      expect(result).toBeDefined();
      expect(mockPrisma.agentProfile.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: Role.AGENT },
      });
    });

    it('should throw DomainError if user already has an agent profile', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.createProfile('user-1', {} as any)).rejects.toThrow(DomainError);
    });
  });

  describe('getProfile', () => {
    it('should return profile', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.getProfile('1');
      expect(result.id).toBe('1');
    });

    it('should throw DomainError if not found', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('1')).rejects.toThrow(DomainError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.agentProfile.update.mockResolvedValue({ id: '1', bio: 'Updated' });

      const result = await service.updateProfile('user-1', { bio: 'Updated' } as any);
      expect(result.bio).toBe('Updated');
    });
  });

  describe('submitVerification', () => {
    it('should submit verification documents', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.agentProfile.update.mockResolvedValue({ id: '1', status: 'PENDING' });

      const result = await service.submitVerification('user-1', { licenseUrl: 'url' } as any);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('verifyAgent', () => {
    it('should verify agent', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.agentProfile.update.mockResolvedValue({ id: '1', isVerified: true });

      const result = await service.verifyAgent('1', { status: 'VERIFIED' } as any);
      expect(result.isVerified).toBe(true);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue(null);
      await expect(service.verifyAgent('1', { status: 'VERIFIED' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAgentReview', () => {
    it('should create review and update agent rating', async () => {
      mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.agentReview.create.mockResolvedValue({ id: 'rev-1', overallRating: 4 });
      mockPrisma.agentReview.findMany.mockResolvedValue([{ overallRating: 4 }, { overallRating: 5 }]);
      mockPrisma.agentProfile.update.mockResolvedValue({ id: '1' });

      const result = await service.createAgentReview('1', 'reviewer-1', {
        professionalism: 4,
        marketKnowledge: 4,
        responsiveness: 4,
        comment: 'Good',
      });

      expect(result.id).toBe('rev-1');
      expect(mockPrisma.agentProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rating: 4.5, reviewCount: 2 }),
        }),
      );
    });
  });
});
