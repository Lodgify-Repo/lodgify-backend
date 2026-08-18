import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class PaymentListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    EventBus.on('payment:received', this.handlePaymentReceived.bind(this), 'PaymentListener');
  }

  async handlePaymentReceived(payload: { reference: string; amount: number; bookingId: string }) {
    this.logger.info(`Received payment:received for ${payload.reference}`);
    // Send payment receipt
  }
}
