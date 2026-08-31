import { Test, TestingModule } from '@nestjs/testing';
import { FoodOrdersController } from './food-orders.controller';

describe('FoodOrdersController', () => {
  let instance: FoodOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodOrdersController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<FoodOrdersController>(FoodOrdersController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
