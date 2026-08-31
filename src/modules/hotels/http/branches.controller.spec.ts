import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from '../services/branches.service';

describe('BranchesController', () => {
  let controller: BranchesController;
  let branchesService: BranchesService;

  const mockBranchesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    reactivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        { provide: BranchesService, useValue: mockBranchesService },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
    branchesService = module.get<BranchesService>(BranchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create branch', async () => {
      mockBranchesService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create('hotel-1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('findAll', () => {
    it('should find all branches for hotel', async () => {
      mockBranchesService.findAll.mockResolvedValue([{ id: '1' }]);
      const result = await controller.findAll('hotel-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should find one branch', async () => {
      mockBranchesService.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1');
      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update branch', async () => {
      mockBranchesService.update.mockResolvedValue({ id: '1' });
      const result = await controller.update('1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('deactivate', () => {
    it('should deactivate branch', async () => {
      mockBranchesService.deactivate.mockResolvedValue({ id: '1', status: 'DEACTIVATED' });
      const result = await controller.deactivate('1');
      expect(result.status).toBe('DEACTIVATED');
    });
  });

  describe('reactivate', () => {
    it('should reactivate branch', async () => {
      mockBranchesService.reactivate.mockResolvedValue({ id: '1', status: 'ACTIVE' });
      const result = await controller.reactivate('1');
      expect(result.status).toBe('ACTIVE');
    });
  });
});
