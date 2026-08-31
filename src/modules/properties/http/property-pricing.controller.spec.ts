import { Test, TestingModule } from '@nestjs/testing';
import { PropertyPricingController } from './property-pricing.controller';
import { PropertyPricingService } from '../services/property-pricing.service';

describe('PropertyPricingController', () => {
  let controller: PropertyPricingController;
  let pricingService: PropertyPricingService;

  const mockPricingService = {
    getPricingRules: jest.fn(),
    createPricingRule: jest.fn(),
    deletePricingRule: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyPricingController],
      providers: [
        { provide: PropertyPricingService, useValue: mockPricingService },
      ],
    }).compile();

    controller = module.get<PropertyPricingController>(PropertyPricingController);
    pricingService = module.get<PropertyPricingService>(PropertyPricingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPricingRules', () => {
    it('should return rules', async () => {
      mockPricingService.getPricingRules.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getPricingRules('p1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createPricingRule', () => {
    it('should create rule', async () => {
      mockPricingService.createPricingRule.mockResolvedValue({ id: '1' });
      const result = await controller.createPricingRule({ user: { id: 'u1' } } as any, 'p1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('deletePricingRule', () => {
    it('should delete rule', async () => {
      mockPricingService.deletePricingRule.mockResolvedValue({ id: '1' });
      const result = await controller.deletePricingRule({ user: { id: 'u1' } } as any, '1');
      expect(result.id).toBe('1');
    });
  });
});
