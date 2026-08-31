import { Test, TestingModule } from '@nestjs/testing';
import { GuestMenuService } from './guest-menu.service';

describe('GuestMenuService', () => {
  let instance: GuestMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestMenuService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<GuestMenuService>(GuestMenuService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
