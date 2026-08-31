import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsService } from './inventory-items.service';

describe('InventoryItemsService', () => {
  let instance: InventoryItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryItemsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryItemsService>(InventoryItemsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
