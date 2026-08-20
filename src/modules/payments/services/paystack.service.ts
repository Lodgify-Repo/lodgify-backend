import { Injectable } from '@nestjs/common';
import Logger from '@/infra/logger/logger.service';
import { PAYSTACK_SECRET_KEY } from '@/common/constants';
import { createHmac } from 'node:crypto';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: { email: string };
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = Logger.getInstance('payment');
  private readonly baseUrl = 'https://api.paystack.co';

  private get headers() {
    return {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(email: string, amount: number, reference: string) {
    this.logger.info(`[Paystack] Initializing payment for ${email} — amount=${amount}, ref=${reference}`);

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ email, amount, reference }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`[Paystack] Initialize failed (${response.status}): ${body}`);
      throw new Error(`Paystack initialization failed: ${response.statusText}`);
    }

    const result: PaystackInitResponse = await response.json();

    if (!result.status) {
      this.logger.error(`[Paystack] Initialize rejected: ${result.message}`);
      throw new Error(`Paystack initialization rejected: ${result.message}`);
    }

    return result.data;
  }

  async verifyPayment(reference: string) {
    this.logger.info(`[Paystack] Verifying payment reference: ${reference}`);

    const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`[Paystack] Verify failed (${response.status}): ${body}`);
      throw new Error(`Paystack verification failed: ${response.statusText}`);
    }

    const result: PaystackVerifyResponse = await response.json();
    return result;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = createHmac('sha512', PAYSTACK_SECRET_KEY || '')
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }
}
