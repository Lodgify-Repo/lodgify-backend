import { Test, TestingModule } from '@nestjs/testing';
import { StockTransfersController } from './stock-transfers.controller';

describe('StockTransfersController', () => {
  let instance: StockTransfersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockTransfersController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<StockTransfersController>(StockTransfersController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
