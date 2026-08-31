import { Test, TestingModule } from '@nestjs/testing';
import { BookingListener } from './booking.listener';

describe('BookingListener', () => {
  let instance: BookingListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<BookingListener>(BookingListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
