import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { InventoryTransactionDto } from '../dto/inventory.dto';
import { DomainError } from '@/common/domain/error';
import { InventoryErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class InventoryTransactionsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // -----------------------------------------
  // F-I04 & F-I05 Goods Receipt & Consumption
  // -----------------------------------------
  async recordTransaction(itemId: string, userId: string, dto: InventoryTransactionDto) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new DomainError(InventoryErrorCodes.ITEM_NOT_FOUND);
    }

    if (dto.type === 'OUT' && item.quantity < dto.quantity) {
      throw new DomainError(InventoryErrorCodes.INSUFFICIENT_STOCK);
    }

    const updatedQuantity =
      dto.type === 'IN' || dto.type === 'ADJUSTMENT'
        ? item.quantity + dto.quantity
        : dto.type === 'OUT'
          ? item.quantity - dto.quantity
          : item.quantity;

    if (updatedQuantity < 0) {
      throw new DomainError(InventoryErrorCodes.INSUFFICIENT_STOCK, 'Resulting quantity cannot be negative');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId,
          type: dto.type,
          quantity: dto.quantity,
          remarks: dto.remarks,
          userId,
          locationId: dto.locationId,
          purchaseOrderId: dto.purchaseOrderId,
          batchNumber: dto.batchNumber,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          roomId: dto.roomId,
          foodOrderId: dto.foodOrderId,
          maintenanceId: dto.maintenanceId,
        },
      });

      // 2. Update global item quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: updatedQuantity },
      });

      // 3. Update location-specific balance if location is provided
      if (dto.locationId) {
        const balance = await tx.stockBalance.findUnique({
          where: { locationId_itemId: { locationId: dto.locationId, itemId } }
        });

        const newBalanceQty =
          dto.type === 'IN' || dto.type === 'ADJUSTMENT'
            ? (balance?.quantity || 0) + dto.quantity
            : (balance?.quantity || 0) - dto.quantity;

        if (newBalanceQty < 0) {
          throw new DomainError(InventoryErrorCodes.INSUFFICIENT_STOCK, 'Location has insufficient stock');
        }

        await tx.stockBalance.upsert({
          where: { locationId_itemId: { locationId: dto.locationId, itemId } },
          update: { quantity: newBalanceQty },
          create: { locationId: dto.locationId, itemId, quantity: newBalanceQty },
        });
      }

      return { transaction, updatedItem };
    });

    if (result.updatedItem.quantity <= result.updatedItem.minThreshold) {
      EventBus.emit(
        'inventory:low_stock',
        { itemId, currentQuantity: result.updatedItem.quantity },
        'InventoryTransactionsService',
      );
    }

    return result;
  }
}
