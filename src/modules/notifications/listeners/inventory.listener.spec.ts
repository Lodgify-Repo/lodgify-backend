import { Test, TestingModule } from '@nestjs/testing';
import { InventoryListener } from './inventory.listener';

describe('InventoryListener', () => {
  let instance: InventoryListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryListener>(InventoryListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
