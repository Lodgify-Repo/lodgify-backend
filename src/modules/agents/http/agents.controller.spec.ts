import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from '../services/agents.service';

describe('AgentsController', () => {
  let controller: AgentsController;
  let agentsService: AgentsService;

  const mockAgentsService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAgentDirectory: jest.fn(),
    getAllAgents: jest.fn(),
    submitVerification: jest.fn(),
    verifyAgent: jest.fn(),
    createAgentReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        { provide: AgentsService, useValue: mockAgentsService },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create profile', async () => {
      const req = { user: { id: '1' } };
      mockAgentsService.createProfile.mockResolvedValue({ id: '1' });
      const result = await controller.createProfile(req, {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getMyProfile', () => {
    it('should get profile', async () => {
      const req = { user: { id: '1' } };
      mockAgentsService.getProfile.mockResolvedValue({ id: '1' });
      const result = await controller.getMyProfile(req);
      expect(result.id).toBe('1');
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile', async () => {
      const req = { user: { id: '1' } };
      mockAgentsService.updateProfile.mockResolvedValue({ id: '1', bio: 'New bio' });
      const result = await controller.updateMyProfile(req, { bio: 'New bio' } as any);
      expect(result.bio).toBe('New bio');
    });
  });

  describe('getAgentDirectory', () => {
    it('should return directory', async () => {
      mockAgentsService.getAgentDirectory.mockResolvedValue({ data: [] });
      const result = await controller.getAgentDirectory({});
      expect(result.data).toBeDefined();
    });
  });

  describe('getAllAgents', () => {
    it('should return all verified agents', async () => {
      mockAgentsService.getAllAgents.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getAllAgents();
      expect(result).toHaveLength(1);
    });
  });

  describe('submitVerification', () => {
    it('should submit verification', async () => {
      const req = { user: { id: '1' } };
      mockAgentsService.submitVerification.mockResolvedValue({ id: '1', status: 'PENDING' });
      const result = await controller.submitVerification(req, {} as any);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('verifyAgent', () => {
    it('should verify agent', async () => {
      mockAgentsService.verifyAgent.mockResolvedValue({ id: '1', isVerified: true });
      const result = await controller.verifyAgent('1', {} as any);
      expect(result.isVerified).toBe(true);
    });
  });

  describe('createAgentReview', () => {
    it('should create review', async () => {
      const req = { user: { id: 'reviewer-1' } };
      mockAgentsService.createAgentReview.mockResolvedValue({ id: 'rev-1' });
      const result = await controller.createAgentReview(req, 'agent-1', {} as any);
      expect(result.id).toBe('rev-1');
    });
  });
});
