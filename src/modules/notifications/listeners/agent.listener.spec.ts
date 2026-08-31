import { Test, TestingModule } from '@nestjs/testing';
import { AgentListener } from './agent.listener';

describe('AgentListener', () => {
  let instance: AgentListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentListener]
    })
    .useMocker((token) => {
      if (typeof token === 'function') {
        return { prototype: {} };
      }
      return {};
    })
    .compile();

    instance = module.get<AgentListener>(AgentListener);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
