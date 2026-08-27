import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma.service';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class InventoryListeners implements OnModuleInit {
  private readonly logger = new Logger(InventoryListeners.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    EventBus.on('room:cleaned', async (payload: { roomId: string; branchId: string; roomTypeId: string; userId: string }) => {
      this.logger.log(`Received room:cleaned event for room ${payload.roomId}`);
      try {
        await this.handleRoomCleaned(payload);
      } catch (error) {
        this.logger.error(`Failed to process room:cleaned event: ${error.message}`, error.stack);
      }
    }, 'InventoryListeners');
  }

  private async handleRoomCleaned(payload: { roomId: string; branchId: string; roomTypeId: string; userId: string }) {
    // F-I12: Auto-deduct inventory linked to this room type
    const links = await this.prisma.roomTypeInventoryLink.findMany({
      where: { roomTypeId: payload.roomTypeId },
    });

    if (links.length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      for (const link of links) {
        const item = await tx.inventoryItem.findUnique({ where: { id: link.itemId } });
        if (!item || item.quantity < link.quantityPerClean) {
          this.logger.warn(`Insufficient stock to auto-deduct ${link.quantityPerClean} of item ${link.itemId} for room ${payload.roomId}`);
          continue;
        }

        await tx.inventoryTransaction.create({
          data: {
            itemId: link.itemId,
            type: 'OUT',
            quantity: link.quantityPerClean,
            remarks: `Auto-deducted for cleaning Room ${payload.roomId}`,
            userId: payload.userId, // Housekeeping staff who cleaned it
            roomId: payload.roomId,
          }
        });

        await tx.inventoryItem.update({
          where: { id: link.itemId },
          data: { quantity: { decrement: link.quantityPerClean } },
        });
      }
    });

    this.logger.log(`Auto-deducted inventory for room ${payload.roomId} cleaning`);
  }
}
