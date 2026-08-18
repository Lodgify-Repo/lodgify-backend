import { Injectable } from '@nestjs/common';
import Logger from '@/infra/logger/logger.service';
import { PAYSTACK_SECRET_KEY } from '@/common/constants';

@Injectable()
export class PaystackService {
  private readonly logger = Logger.getInstance('payment');

  async initializePayment(email: string, amount: number, reference: string) {
    this.logger.info(`[Paystack] Initializing payment for ${email} with amount ${amount} (Ref: ${reference})`);
    
    // MOCK implementation
    return {
      authorization_url: `https://checkout.paystack.com/${reference}`,
      access_code: 'mock_access_code',
      reference,
    };
  }

  async verifyPayment(reference: string) {
    this.logger.info(`[Paystack] Verifying payment reference: ${reference}`);
    
    // MOCK implementation
    return {
      status: true,
      data: {
        status: 'success',
        reference,
        amount: 5000000, // in kobo
      }
    };
  }
}
