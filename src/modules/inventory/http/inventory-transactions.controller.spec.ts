import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionsController } from './inventory-transactions.controller';

describe('InventoryTransactionsController', () => {
  let instance: InventoryTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryTransactionsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryTransactionsController>(InventoryTransactionsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
