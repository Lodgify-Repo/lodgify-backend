import { Test, TestingModule } from '@nestjs/testing';
import { PaymentListener } from './payment.listener';

describe('PaymentListener', () => {
  let instance: PaymentListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<PaymentListener>(PaymentListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
