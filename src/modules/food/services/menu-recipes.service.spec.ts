import { Test, TestingModule } from '@nestjs/testing';
import { MenuRecipesService } from './menu-recipes.service';

describe('MenuRecipesService', () => {
  let instance: MenuRecipesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuRecipesService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuRecipesService>(MenuRecipesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
