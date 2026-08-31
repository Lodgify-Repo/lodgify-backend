import { Test, TestingModule } from '@nestjs/testing';
import { MenuRecipesController } from './menu-recipes.controller';

describe('MenuRecipesController', () => {
  let instance: MenuRecipesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuRecipesController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuRecipesController>(MenuRecipesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
