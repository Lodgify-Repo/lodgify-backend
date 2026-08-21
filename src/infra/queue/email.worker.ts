import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { MailService, EmailPayload } from '@/infra/mail/mail.service';
import Logger from '@/infra/logger/logger.service';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } from '@/common/constants';

export const EMAIL_QUEUE_NAME = 'email-notifications';

export interface EmailJobData {
  emails: EmailPayload[];
  tag: string;
}

@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = Logger.getInstance('mail');

  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    this.worker = new Worker<EmailJobData>(
      EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        this.logger.info(`[EmailWorker] Processing job ${job.id} (tag: ${job.data.tag}, attempt ${job.attemptsMade + 1})`);
        await this.mailService.sendBulk(job.data.emails, job.data.tag);
        this.logger.info(`[EmailWorker] Completed job ${job.id}`);
      },
      {
        connection: {
          host: REDIS_HOST ?? 'localhost',
          port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
          password: REDIS_PASSWORD,
          db: REDIS_DB ? Number(REDIS_DB) : 0,
        },
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`[EmailWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
    });

    this.worker.on('error', (err) => {
      this.logger.error(`[EmailWorker] Worker error: ${err.message}`);
    });

    this.logger.info(`[EmailWorker] Worker started for queue "${EMAIL_QUEUE_NAME}"`);
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.info(`[EmailWorker] Worker shut down gracefully`);
    }
  }
}
