import { Test, TestingModule } from '@nestjs/testing';
import { ReminderCron } from './reminder.cron';

describe('ReminderCron', () => {
  let instance: ReminderCron;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReminderCron]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<ReminderCron>(ReminderCron);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
