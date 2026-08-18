import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { InitiatePaymentDto } from '../dto/payments.dto';
import { PaystackService } from './paystack.service';
import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@/common/events/event-bus';

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

    // 1. Save pending payment to DB
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: initiatePaymentDto.bookingId,
        amount: initiatePaymentDto.amount,
        reference,
        method: 'PAYSTACK',
      },
    });

    // 2. Call Paystack API
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

  async verifyWebhook(event: string, data: any) {
    if (event === 'charge.success') {
      const reference = data.reference;
      
      const payment = await this.prisma.payment.findUnique({ where: { reference } });
      if (payment && payment.status !== 'SUCCESS') {
        // 1. Mark as SUCCESS
        await this.prisma.payment.update({
          where: { reference },
          data: { status: 'SUCCESS', gatewayResponse: data },
        });

        // 2. Update booking status
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });

        // 3. Emit event
        // EventBus.getInstance().emit('payment:received', { reference, amount: payment.amount, bookingId: payment.bookingId }, 'PaymentsService');
      }
    }
  }
}
