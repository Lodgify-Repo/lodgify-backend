import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategoriesService } from './menu-categories.service';

describe('MenuCategoriesService', () => {
  let instance: MenuCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuCategoriesService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuCategoriesService>(MenuCategoriesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
