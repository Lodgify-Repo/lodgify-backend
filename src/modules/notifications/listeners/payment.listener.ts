import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class PaymentListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    EventBus.on('payment:received', this.handlePaymentReceived.bind(this), 'PaymentListener');
  }

  async handlePaymentReceived(payload: { reference: string; amount: number; bookingId: string }) {
    this.logger.info(`Received payment:received for ${payload.reference}`);

    const payment = await this.prisma.payment.findUnique({
      where: { reference: payload.reference },
      include: {
        booking: {
          include: {
            guest: true,
            branch: true,
          },
        },
      },
    });

    if (payment) {
      const { booking } = payment;
      const html = this.mailService.compileTemplate('payment_receipt', {
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        reference: payload.reference,
        amount: payload.amount.toLocaleString(),
        branchName: booking.branch.name,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        checkOutDate: booking.checkOutDate.toLocaleDateString(),
        year: new Date().getFullYear(),
      });

      await this.mailService.sendBulk([
        {
          to: booking.guest.email,
          subject: `Payment Receipt - ${payload.reference}`,
          html,
        }
      ], 'payment_receipt');
    }
  }
}
