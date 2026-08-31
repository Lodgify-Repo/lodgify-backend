import { Test, TestingModule } from '@nestjs/testing';
import { DailySpecialsController } from './daily-specials.controller';

describe('DailySpecialsController', () => {
  let instance: DailySpecialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailySpecialsController]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<DailySpecialsController>(DailySpecialsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
