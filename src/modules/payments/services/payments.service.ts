import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { InitiatePaymentDto } from '../dto/payments.dto';
import { PaystackService } from './paystack.service';
import { v4 as uuidv4 } from 'uuid';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class PaymentsService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {
    super();
  }

  async initiate(initiatePaymentDto: InitiatePaymentDto) {
    const reference = `LODGIFY_${uuidv4()}`;

    // Save pending payment to DB
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: initiatePaymentDto.bookingId,
        amount: initiatePaymentDto.amount,
        reference,
        method: 'PAYSTACK',
      },
    });

    // Call Paystack API
    const response = await this.paystackService.initializePayment(
      initiatePaymentDto.email,
      initiatePaymentDto.amount * 100, // convert to kobo
      reference
    );

    return {
      payment,
      authorizationUrl: response.authorization_url,
    };
  }

  async verifyWebhook(rawBody: string, signature: string) {
    // Verify HMAC signature
    if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const reference = data.reference;
      
      const payment = await this.prisma.payment.findUnique({ where: { reference } });

      // Idempotency: skip if already processed
      if (!payment || payment.status === 'SUCCESS') {
        return;
      }

      // Wrap payment + booking update in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { reference },
          data: { status: 'SUCCESS', gatewayResponse: data },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      });

      EventBus.emit(
        'payment:received',
        { reference, amount: payment.amount, bookingId: payment.bookingId },
        'PaymentsService',
      );
    }
  }
}
