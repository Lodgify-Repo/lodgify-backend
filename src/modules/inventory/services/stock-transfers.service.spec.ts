import { Test, TestingModule } from '@nestjs/testing';
import { StockTransfersService } from './stock-transfers.service';

describe('StockTransfersService', () => {
  let instance: StockTransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTransfersService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<StockTransfersService>(StockTransfersService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
