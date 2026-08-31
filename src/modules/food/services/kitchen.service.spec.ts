import { Test, TestingModule } from '@nestjs/testing';
import { KitchenService } from './kitchen.service';

describe('KitchenService', () => {
  let instance: KitchenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KitchenService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<KitchenService>(KitchenService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
