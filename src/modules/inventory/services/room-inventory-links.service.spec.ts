import { Test, TestingModule } from '@nestjs/testing';
import { RoomInventoryLinksService } from './room-inventory-links.service';

describe('RoomInventoryLinksService', () => {
  let instance: RoomInventoryLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomInventoryLinksService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<RoomInventoryLinksService>(RoomInventoryLinksService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
