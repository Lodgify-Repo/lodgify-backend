import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailWorker } from './email.worker';

@Global()
@Module({
  providers: [QueueService, EmailWorker],
  exports: [QueueService],
})
export class QueueModule {}
