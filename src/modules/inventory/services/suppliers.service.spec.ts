import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let instance: SuppliersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuppliersService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<SuppliersService>(SuppliersService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
