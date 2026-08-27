import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class PropertyListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    EventBus.on('property:inquiry', this.handleInquiry.bind(this), 'PropertyListener');
    EventBus.on('property:viewing_requested', this.handleViewing.bind(this), 'PropertyListener');
    EventBus.on('property:offer_submitted', this.handleOffer.bind(this), 'PropertyListener');
  }

  async handleInquiry(payload: { inquiryId: string }) {
    const inquiry = await this.prisma.propertyInquiry.findUnique({
      where: { id: payload.inquiryId },
      include: { property: { include: { owner: true, authorizations: { where: { status: 'APPROVED' }, include: { agent: { include: { user: true } } } } } } }
    });
    if (inquiry) {
      this.sendPropertyAlert(inquiry.property, payload.inquiryId, 'New Inquiry', 'A new inquiry has been made for your property.');
    }
  }

  async handleViewing(payload: { viewingId: string }) {
    const viewing = await this.prisma.viewingAppointment.findUnique({
      where: { id: payload.viewingId },
      include: { property: { include: { owner: true, authorizations: { where: { status: 'APPROVED' }, include: { agent: { include: { user: true } } } } } } }
    });
    if (viewing) {
      this.sendPropertyAlert(viewing.property, payload.viewingId, 'Viewing Requested', 'A new viewing has been requested for your property.');
    }
  }

  async handleOffer(payload: { offerId: string }) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: payload.offerId },
      include: { property: { include: { owner: true, authorizations: { where: { status: 'APPROVED' }, include: { agent: { include: { user: true } } } } } } }
    });
    if (offer) {
      this.sendPropertyAlert(offer.property, payload.offerId, 'Offer Submitted', 'A new offer has been submitted for your property.');
    }
  }

  private async sendPropertyAlert(property: any, entityId: string, eventType: string, message: string) {
    this.logger.info(`Sending property alert for ${eventType} (ID: ${entityId})`);
    
    const ownerEmail = property.owner?.email;
    const agentEmails = property.authorizations?.map((a: any) => a.agent?.user?.email).filter(Boolean) || [];

    const html = this.mailService.compileTemplate('property_alert', {
      eventType,
      message,
      entityId,
      year: new Date().getFullYear(),
    });

    const emails: { to: string; subject: string; html: string }[] = [];
    if (ownerEmail) emails.push({ to: ownerEmail, subject: `Property Alert - ${eventType}`, html });
    agentEmails.forEach((email: string) => {
      emails.push({ to: email, subject: `Property Alert - ${eventType}`, html });
    });

    if (emails.length > 0) {
      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'property_alert', {
        emails,
        tag: 'property_alert',
      });
    }
  }
}
