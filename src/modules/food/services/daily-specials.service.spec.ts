import { Test, TestingModule } from '@nestjs/testing';
import { DailySpecialsService } from './daily-specials.service';

describe('DailySpecialsService', () => {
  let instance: DailySpecialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailySpecialsService]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<DailySpecialsService>(DailySpecialsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
