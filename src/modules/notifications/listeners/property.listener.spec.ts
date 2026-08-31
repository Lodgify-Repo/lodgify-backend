import { Test, TestingModule } from '@nestjs/testing';
import { PropertyListener } from './property.listener';

describe('PropertyListener', () => {
  let instance: PropertyListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<PropertyListener>(PropertyListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
