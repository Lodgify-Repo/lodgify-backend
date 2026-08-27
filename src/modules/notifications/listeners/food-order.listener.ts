import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class FoodOrderListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    EventBus.on('food_order:created', this.handleFoodOrderCreated.bind(this), 'FoodOrderListener');
    EventBus.on('food_order:status_changed', this.handleFoodOrderStatusChanged.bind(this), 'FoodOrderListener');
  }

  async handleFoodOrderCreated(payload: { orderId: string }) {
    this.logger.info(`Received food_order:created for ${payload.orderId}`);
    
    const order = await this.prisma.foodOrder.findUnique({
      where: { id: payload.orderId },
      include: {
        items: { include: { menuItem: true } },
        branch: true,
        booking: { include: { guest: true, room: true } },
      },
    });

    if (order && order.branch?.contactEmail) {
      const itemsList = order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ');
      const roomNumber = order.booking?.room?.roomNumber || order.tableNumber || 'N/A';

      const kitchenHtml = this.mailService.compileTemplate('food_order_kitchen', {
        orderId: order.id,
        roomNumber,
        itemsList,
        totalAmount: order.totalAmount.toLocaleString(),
        notes: order.specialNotes,
        year: new Date().getFullYear(),
      });

      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'food_order_kitchen', {
        emails: [
          {
            to: order.branch.contactEmail,
            subject: `New Food Order - Room/Table ${roomNumber}`,
            html: kitchenHtml,
          }
        ],
        tag: 'food_order_kitchen',
      });
    }
  }

  async handleFoodOrderStatusChanged(payload: { orderId: string, status: string }) {
    this.logger.info(`Received food_order:status_changed for ${payload.orderId}`);
    
    const order = await this.prisma.foodOrder.findUnique({
      where: { id: payload.orderId },
      include: {
        booking: { include: { guest: true, branch: true } },
      },
    });

    if (order && order.booking?.guest?.email) {
      const guestHtml = this.mailService.compileTemplate('food_order_guest', {
        orderId: order.id,
        status: payload.status,
        guestName: order.booking.guest.firstName,
        branchName: order.booking.branch.name,
        year: new Date().getFullYear(),
      });

      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'food_order_guest', {
        emails: [
          {
            to: order.booking.guest.email,
            subject: `Food Order Update - ${payload.status}`,
            html: guestHtml,
          }
        ],
        tag: 'food_order_guest',
      });
    }
  }
}
