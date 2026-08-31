import { Test, TestingModule } from '@nestjs/testing';
import { FoodService } from './food.service';

describe('FoodService', () => {
  let instance: FoodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<FoodService>(FoodService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
