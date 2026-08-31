import { Test, TestingModule } from '@nestjs/testing';
import { KitchenController } from './kitchen.controller';

describe('KitchenController', () => {
  let instance: KitchenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KitchenController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<KitchenController>(KitchenController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
