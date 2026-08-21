import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateInventoryItemDto, InventoryTransactionDto } from '../dto/inventory.dto';
import { DomainError } from '@/common/domain/error';
import { InventoryErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class InventoryService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createItem(branchId: string, createDto: CreateInventoryItemDto) {
    return await this.prisma.inventoryItem.create({
      data: {
        ...createDto,
        branchId,
      },
    });
  }

  async getItemsByBranch(branchId: string) {
    return await this.prisma.inventoryItem.findMany({
      where: { branchId },
      include: { category: true },
    });
  }

  async recordTransaction(itemId: string, userId: string, dto: InventoryTransactionDto) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new DomainError(InventoryErrorCodes.ITEM_NOT_FOUND);
    }

    if (dto.type === 'OUT' && item.quantity < dto.quantity) {
      throw new DomainError(InventoryErrorCodes.INSUFFICIENT_STOCK);
    }

    // IN / ADJUSTMENT = add to current stock (ADJUSTMENT can have positive or negative quantity)
    // OUT = subtract from current stock
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
      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId,
          type: dto.type,
          quantity: dto.quantity,
          remarks: dto.remarks,
          userId,
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: updatedQuantity },
      });

      return { transaction, updatedItem };
    });

    if (result.updatedItem.quantity <= result.updatedItem.minThreshold) {
      EventBus.emit(
        'inventory:low_stock',
        { itemId, currentQuantity: result.updatedItem.quantity },
        'InventoryService',
      );
    }

    return result;
  }
}
