import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionsService } from './inventory-transactions.service';

describe('InventoryTransactionsService', () => {
  let instance: InventoryTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryTransactionsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<InventoryTransactionsService>(InventoryTransactionsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
