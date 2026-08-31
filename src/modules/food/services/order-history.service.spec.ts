import { Test, TestingModule } from '@nestjs/testing';
import { OrderHistoryService } from './order-history.service';

describe('OrderHistoryService', () => {
  let instance: OrderHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderHistoryService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<OrderHistoryService>(OrderHistoryService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
