import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } from '@/common/constants';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class QueueService {
  private queues = new Map<string, Queue>();
  private readonly logger = Logger.getInstance('server');

  public getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: REDIS_HOST ?? 'localhost',
          port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
          password: REDIS_PASSWORD,
          db: REDIS_DB ? Number(REDIS_DB) : 0,
        },
      });
      this.queues.set(name, queue);
      this.logger.info(`Initialized queue: ${name}`);
    }
    return this.queues.get(name)!;
  }

  public async addJob(queueName: string, jobName: string, data: any, opts?: any): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data, opts);
  }
}
