import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class InventoryListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    EventBus.on('inventory:low_stock', this.handleStockUpdated.bind(this), 'InventoryListener');
  }

  async handleStockUpdated(payload: { itemId: string; currentQuantity: number }) {
    this.logger.info(`Low stock detected for item ${payload.itemId}`);
    
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: payload.itemId },
      include: { branch: true },
    });

    if (!item) return;

    // F-I06: Fetch the alert configuration for this branch
    const alertConfig = await this.prisma.inventoryAlertConfig.findUnique({
      where: { branchId: item.branchId },
    });

    let recipients: string[] = [];

    // Prioritize configured email recipients, fallback to branch contact email if none configured
    if (alertConfig && alertConfig.emailRecipients.length > 0) {
      recipients = alertConfig.emailRecipients;
    } else if (item.branch?.contactEmail) {
      recipients = [item.branch.contactEmail];
    }

    if (recipients.length > 0) {
      const html = this.mailService.compileTemplate('low_stock_alert', {
        itemName: item.name,
        sku: item.sku,
        currentStock: payload.currentQuantity,
        reorderThreshold: item.minThreshold,
        branchName: item.branch.name,
        year: new Date().getFullYear(),
      });

      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'low_stock_alert', {
        emails: recipients.map(email => ({
          to: email,
          subject: `Low Stock Alert: ${item.name}`,
          html,
        })),
        tag: 'low_stock_alert',
      });
      
      this.logger.info(`Dispatched low stock email to ${recipients.join(', ')}`);
    }
  }
}
