import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategoriesController } from './menu-categories.controller';

describe('MenuCategoriesController', () => {
  let instance: MenuCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuCategoriesController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuCategoriesController>(MenuCategoriesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
