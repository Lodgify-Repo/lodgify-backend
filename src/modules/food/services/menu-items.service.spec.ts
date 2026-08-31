import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemsService } from './menu-items.service';

describe('MenuItemsService', () => {
  let instance: MenuItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuItemsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuItemsService>(MenuItemsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
