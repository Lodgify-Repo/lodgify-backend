import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemsController } from './menu-items.controller';

describe('MenuItemsController', () => {
  let instance: MenuItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuItemsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<MenuItemsController>(MenuItemsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
