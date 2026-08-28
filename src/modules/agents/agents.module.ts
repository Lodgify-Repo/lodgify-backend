import { Module } from '@nestjs/common';

// Services
import { AgentsService } from './services/agents.service';
import { AgentAuthorizationsService } from './services/agent-authorizations.service';
import { AgentLeadsService } from './services/agent-leads.service';
import { AgentCommissionsService } from './services/agent-commissions.service';

// Controllers
import { AgentsController } from './http/agents.controller';
import { AgentAuthorizationsController } from './http/agent-authorizations.controller';
import { AgentLeadsController } from './http/agent-leads.controller';
import { AgentCommissionsController } from './http/agent-commissions.controller';

@Module({
  controllers: [
    AgentsController,
    AgentAuthorizationsController,
    AgentLeadsController,
    AgentCommissionsController,
  ],
  providers: [
    AgentsService,
    AgentAuthorizationsService,
    AgentLeadsService,
    AgentCommissionsService,
  ],
  exports: [
    AgentsService,
    AgentAuthorizationsService,
    AgentLeadsService,
    AgentCommissionsService,
  ],
})
export class AgentsModule {}
