import { Test, TestingModule } from '@nestjs/testing';
import { FoodController } from './food.controller';

describe('FoodController', () => {
  let instance: FoodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<FoodController>(FoodController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
