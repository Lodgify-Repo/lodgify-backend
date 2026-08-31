import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesService } from '../services/room-types.service';

describe('RoomTypesController', () => {
  let controller: RoomTypesController;
  let roomTypesService: RoomTypesService;

  const mockRoomTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    addPricingRule: jest.fn(),
    calculateDynamicPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTypesController],
      providers: [
        { provide: RoomTypesService, useValue: mockRoomTypesService },
      ],
    }).compile();

    controller = module.get<RoomTypesController>(RoomTypesController);
    roomTypesService = module.get<RoomTypesService>(RoomTypesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create room type', async () => {
      mockRoomTypesService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create('b1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('findAll', () => {
    it('should return all room types for branch', async () => {
      mockRoomTypesService.findAll.mockResolvedValue([{ id: '1' }]);
      const result = await controller.findAll('b1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update room type', async () => {
      mockRoomTypesService.update.mockResolvedValue({ id: '1' });
      const result = await controller.update('1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('addPricingRule', () => {
    it('should add pricing rule', async () => {
      mockRoomTypesService.addPricingRule.mockResolvedValue({ id: '1' });
      const result = await controller.addPricingRule('1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getDynamicPrice', () => {
    it('should calculate price', async () => {
      mockRoomTypesService.calculateDynamicPrice.mockResolvedValue({ dynamicPrice: 120 });
      const result = await controller.getDynamicPrice('1', '2025-01-01');
      expect(result.dynamicPrice).toBe(120);
    });
  });
});
