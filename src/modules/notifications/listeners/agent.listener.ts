import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class AgentListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    EventBus.on('commission:earned', this.handleCommissionEarned.bind(this), 'AgentListener');
    EventBus.on('agent_auth:granted', this.handleAuthGranted.bind(this), 'AgentListener');
    EventBus.on('agent_auth:revoked', this.handleAuthRevoked.bind(this), 'AgentListener');
  }

  async handleCommissionEarned(payload: { agentEmail: string; agentName: string; amount: number; reference: string }) {
    this.logger.info(`Received commission:earned for agent ${payload.agentEmail}`);
    
    const html = this.mailService.compileTemplate('commission_alert', {
      agentName: payload.agentName,
      amount: payload.amount.toLocaleString(),
      reference: payload.reference,
      year: new Date().getFullYear(),
    });

    await this.queueService.addJob(EMAIL_QUEUE_NAME, 'commission_alert', {
      emails: [
        {
          to: payload.agentEmail,
          subject: 'New Commission Earned! 🎉',
          html,
        }
      ],
      tag: 'commission_alert',
    });
  }

  async handleAuthGranted(payload: { agentEmail: string; agentName: string; propertyName: string }) {
    this.sendAuthAlert(payload, 'Authorization Granted', `You have been granted authorization to represent the property: ${payload.propertyName}.`);
  }

  async handleAuthRevoked(payload: { agentEmail: string; agentName: string; propertyName: string }) {
    this.sendAuthAlert(payload, 'Authorization Revoked', `Your authorization to represent the property: ${payload.propertyName} has been revoked.`);
  }

  private async sendAuthAlert(payload: any, eventType: string, message: string) {
    this.logger.info(`Sending agent auth alert to ${payload.agentEmail}`);
    
    const html = this.mailService.compileTemplate('agent_auth_alert', {
      agentName: payload.agentName,
      eventType,
      message,
      year: new Date().getFullYear(),
    });

    await this.queueService.addJob(EMAIL_QUEUE_NAME, 'agent_auth_alert', {
      emails: [
        {
          to: payload.agentEmail,
          subject: `Agent Update: ${eventType}`,
          html,
        }
      ],
      tag: 'agent_auth_alert',
    });
  }
}
