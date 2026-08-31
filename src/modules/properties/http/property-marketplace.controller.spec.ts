import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMarketplaceController } from './property-marketplace.controller';
import { PropertyMarketplaceService } from '../services/property-marketplace.service';

describe('PropertyMarketplaceController', () => {
  let controller: PropertyMarketplaceController;
  let marketplaceService: PropertyMarketplaceService;

  const mockMarketplaceService = {
    searchMarketplace: jest.fn(),
    getMapPins: jest.fn(),
    getSimilarProperties: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyMarketplaceController],
      providers: [
        { provide: PropertyMarketplaceService, useValue: mockMarketplaceService },
      ],
    }).compile();

    controller = module.get<PropertyMarketplaceController>(PropertyMarketplaceController);
    marketplaceService = module.get<PropertyMarketplaceService>(PropertyMarketplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchMarketplace', () => {
    it('should search', async () => {
      mockMarketplaceService.searchMarketplace.mockResolvedValue({ data: [] });
      const result = await controller.searchMarketplace({});
      expect(result.data).toBeDefined();
    });
  });

  describe('getMapPins', () => {
    it('should return pins', async () => {
      mockMarketplaceService.getMapPins.mockResolvedValue({ pins: [] });
      const result = await controller.getMapPins('10', '20');
      expect(result.pins).toBeDefined();
    });
  });

  describe('getSimilarProperties', () => {
    it('should return similar properties', async () => {
      mockMarketplaceService.getSimilarProperties.mockResolvedValue([]);
      const result = await controller.getSimilarProperties('1', '4');
      expect(result).toBeDefined();
    });
  });
});
