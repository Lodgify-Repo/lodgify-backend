import { Test, TestingModule } from '@nestjs/testing';
import { OrderHistoryController } from './order-history.controller';

describe('OrderHistoryController', () => {
  let instance: OrderHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderHistoryController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<OrderHistoryController>(OrderHistoryController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
