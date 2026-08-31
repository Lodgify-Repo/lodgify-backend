import { Test, TestingModule } from '@nestjs/testing';
import { GuestMenuController } from './guest-menu.controller';

describe('GuestMenuController', () => {
  let instance: GuestMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestMenuController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<GuestMenuController>(GuestMenuController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
