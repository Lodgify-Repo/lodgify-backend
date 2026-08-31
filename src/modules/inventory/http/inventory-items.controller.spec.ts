import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsController } from './inventory-items.controller';

describe('InventoryItemsController', () => {
  let instance: InventoryItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryItemsController>(InventoryItemsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
