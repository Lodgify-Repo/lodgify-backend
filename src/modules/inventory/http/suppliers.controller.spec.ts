import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';

describe('SuppliersController', () => {
  let instance: SuppliersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<SuppliersController>(SuppliersController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
