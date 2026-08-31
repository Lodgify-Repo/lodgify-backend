import { Test, TestingModule } from '@nestjs/testing';
import { RoomInventoryLinksController } from './room-inventory-links.controller';

describe('RoomInventoryLinksController', () => {
  let instance: RoomInventoryLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomInventoryLinksController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<RoomInventoryLinksController>(RoomInventoryLinksController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
