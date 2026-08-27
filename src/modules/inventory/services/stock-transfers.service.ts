import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateStockTransferDto, UpdateTransferStatusDto } from '../dto/inventory-extended.dto';

@Injectable()
export class StockTransfersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createTransfer(fromBranchId: string, requestedBy: string, dto: CreateStockTransferDto) {
    if (fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Cannot transfer stock to the same branch');
    }

    return await this.prisma.stockTransfer.create({
      data: {
        fromBranchId,
        toBranchId: dto.toBranchId,
        requestedBy,
        items: {
          create: dto.items.map(i => ({
            itemId: i.itemId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getTransfers(branchId: string, role: 'FROM' | 'TO') {
    const where = role === 'FROM' ? { fromBranchId: branchId } : { toBranchId: branchId };
    return await this.prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        items: {
          include: { item: { select: { name: true, unit: true } } }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(transferId: string, dto: UpdateTransferStatusDto, userId: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');

    if (transfer.status === 'RECEIVED' || transfer.status === 'REJECTED') {
      throw new BadRequestException(`Cannot update transfer in ${transfer.status} state`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: dto.status },
      });

      // If approved, deduct from source branch
      if (dto.status === 'APPROVED' && transfer.status === 'PENDING') {
        for (const item of transfer.items) {
          await tx.inventoryTransaction.create({
            data: {
              itemId: item.itemId,
              type: 'OUT',
              quantity: item.quantity,
              remarks: `Transfer ${transferId} to branch ${transfer.toBranchId}`,
              userId,
            }
          });

          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // Strict mapping by SKU
      if (dto.status === 'RECEIVED' && transfer.status === 'IN_TRANSIT') {
        for (const item of transfer.items) {
          const sourceItem = await tx.inventoryItem.findUnique({ where: { id: item.itemId } });
          if (!sourceItem) {
            throw new BadRequestException(`Source item ${item.itemId} no longer exists.`);
          }

          if (!sourceItem.sku && !sourceItem.barcode) {
            throw new BadRequestException(`Item "${sourceItem.name}" lacks an SKU or Barcode. Inter-branch transfers require strict master data (SKU/Barcode) mapping.`);
          }

          // Strict match by SKU or Barcode in the destination branch
          const destItem = await tx.inventoryItem.findFirst({
            where: {
              branchId: transfer.toBranchId,
              OR: [
                ...(sourceItem.sku ? [{ sku: sourceItem.sku }] : []),
                ...(sourceItem.barcode ? [{ barcode: sourceItem.barcode }] : [])
              ]
            }
          });

          if (!destItem) {
            throw new BadRequestException(`Destination branch missing item with SKU: ${sourceItem.sku || 'N/A'}, Barcode: ${sourceItem.barcode || 'N/A'}. Cannot complete transfer.`);
          }

          // Record receipt transaction
          await tx.inventoryTransaction.create({
            data: {
              itemId: destItem.id,
              type: 'IN',
              quantity: item.quantity,
              remarks: `Received transfer ${transferId} from branch ${transfer.fromBranchId}`,
              userId,
            }
          });

          // Update destination global quantity
          await tx.inventoryItem.update({
            where: { id: destItem.id },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      return updated;
    });
  }
}
