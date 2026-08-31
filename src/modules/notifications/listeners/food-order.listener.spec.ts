import { Test, TestingModule } from '@nestjs/testing';
import { FoodOrderListener } from './food-order.listener';

describe('FoodOrderListener', () => {
  let instance: FoodOrderListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodOrderListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<FoodOrderListener>(FoodOrderListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
