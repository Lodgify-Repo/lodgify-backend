import { Test, TestingModule } from '@nestjs/testing';
import { FoodOrdersService } from './food-orders.service';

describe('FoodOrdersService', () => {
  let instance: FoodOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodOrdersService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<FoodOrdersService>(FoodOrdersService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
