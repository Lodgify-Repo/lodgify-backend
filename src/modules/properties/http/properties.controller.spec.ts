import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from '../services/properties.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let propertiesService: PropertiesService;

  const mockPropertiesService = {
    create: jest.fn(),
    getOwnerProperties: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setListingStatus: jest.fn(),
    remove: jest.fn(),
    verifyProperty: jest.fn(),
    submitOwnerVerification: jest.fn(),
    getSalesAnalytics: jest.fn(),
    verifyOwner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: mockPropertiesService },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    propertiesService = module.get<PropertiesService>(PropertiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create property', async () => {
      mockPropertiesService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create({ user: { id: 'u1' } } as any, {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getOwnerProperties', () => {
    it('should get properties', async () => {
      mockPropertiesService.getOwnerProperties.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getOwnerProperties({ user: { id: 'u1' } } as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return property', async () => {
      mockPropertiesService.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1');
      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update property', async () => {
      mockPropertiesService.update.mockResolvedValue({ id: '1' });
      const result = await controller.update({ user: { id: 'u1' } } as any, '1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('setListingStatus', () => {
    it('should set status', async () => {
      mockPropertiesService.setListingStatus.mockResolvedValue({ id: '1', status: 'PAUSED' });
      const result = await controller.setListingStatus({ user: { id: 'u1' } } as any, '1', 'PAUSED');
      expect(result.status).toBe('PAUSED');
    });
  });
});
