import { Test, TestingModule } from '@nestjs/testing';
import { StockCountsService } from './stock-counts.service';

describe('StockCountsService', () => {
  let instance: StockCountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockCountsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<StockCountsService>(StockCountsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
