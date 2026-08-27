import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { InitiateStockCountDto, RecordCountItemDto, ResolveVarianceDto } from '../dto/inventory-extended.dto';

@Injectable()
export class StockCountsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async initiateCount(branchId: string, userId: string, dto: InitiateStockCountDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create StockCount
      const count = await tx.stockCount.create({
        data: {
          branchId,
          initiatedBy: userId,
          notes: dto.notes,
        },
      });

      // 2. Snapshot current quantities for all items in the branch
      const items = await tx.inventoryItem.findMany({ where: { branchId, deletedAt: null } });
      const countItems = items.map((item) => ({
        stockCountId: count.id,
        itemId: item.id,
        systemQuantity: item.quantity,
      }));

      await tx.stockCountItem.createMany({
        data: countItems,
      });

      return count;
    });
  }

  async getCounts(branchId: string) {
    return await this.prisma.stockCount.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCountDetails(countId: string) {
    const count = await this.prisma.stockCount.findUnique({
      where: { id: countId },
      include: {
        items: {
          include: { item: { select: { name: true, sku: true, unit: true } } },
          orderBy: { item: { name: 'asc' } },
        },
      },
    });
    if (!count) throw new NotFoundException('Count not found');
    return count;
  }

  async recordActualQuantity(countId: string, itemId: string, dto: RecordCountItemDto) {
    const countItem = await this.prisma.stockCountItem.findFirst({
      where: { stockCountId: countId, itemId },
    });

    if (!countItem) throw new NotFoundException('Item not part of this count');

    const variance = dto.actualQuantity - countItem.systemQuantity;
    const status = variance === 0 ? 'COUNTED' : 'PENDING'; // Needs review if there's variance

    return await this.prisma.stockCountItem.update({
      where: { id: countItem.id },
      data: {
        actualQuantity: dto.actualQuantity,
        variance,
        status,
        notes: dto.notes,
      },
    });
  }

  async resolveVariance(countId: string, itemId: string, dto: ResolveVarianceDto, userId: string) {
    const countItem = await this.prisma.stockCountItem.findFirst({
      where: { stockCountId: countId, itemId },
    });

    if (!countItem) throw new NotFoundException('Item not part of this count');
    if (countItem.actualQuantity === null) throw new BadRequestException('Actual quantity not recorded yet');
    if (countItem.variance === 0) throw new BadRequestException('No variance to resolve');

    if (dto.action === 'FLAG_FOR_REVIEW') {
      return await this.prisma.stockCountItem.update({
        where: { id: countItem.id },
        data: { status: 'FLAGGED' },
      });
    }

    if (dto.action === 'AUTO_ADJUST') {
      return await this.prisma.$transaction(async (tx) => {
        // Adjust inventory to match actual
        await tx.inventoryTransaction.create({
          data: {
            itemId,
            type: 'ADJUSTMENT',
            quantity: countItem.variance!, // can be negative
            remarks: `Auto-adjust from Stock Count ${countId}`,
            userId,
          },
        });

        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: countItem.actualQuantity! },
        });

        return await tx.stockCountItem.update({
          where: { id: countItem.id },
          data: { status: 'ADJUSTED', adjustedAt: new Date() },
        });
      });
    }
  }

  async completeCount(countId: string) {
    // Check if any items are still pending
    const pending = await this.prisma.stockCountItem.count({
      where: { stockCountId: countId, status: 'PENDING', variance: { not: 0 } },
    });

    if (pending > 0) {
      throw new BadRequestException('Cannot complete count with unresolved variances');
    }

    return await this.prisma.stockCount.update({
      where: { id: countId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
