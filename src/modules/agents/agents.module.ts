import { Module } from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { AgentsController } from './http/agents.controller';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
