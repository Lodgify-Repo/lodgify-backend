import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class InventoryAnalyticsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAnalytics(branchId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate || new Date();

    // 1. Consumption trends
    const outTransactions = await this.prisma.inventoryTransaction.groupBy({
      by: ['itemId'],
      where: {
        item: { branchId },
        type: 'OUT',
        createdAt: { gte: start, lte: end },
      },
      _sum: { quantity: true },
    });

    const itemIds = outTransactions.map(t => t.itemId);
    const items = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, category: { select: { name: true } }, costPerUnit: true },
    });

    const itemMap = new Map(items.map(i => [i.id, i]));

    const consumptionTrends = outTransactions.map(t => {
      const item = itemMap.get(t.itemId);
      const consumedQty = t._sum.quantity || 0;
      const cost = (item?.costPerUnit || 0) * consumedQty;
      return {
        itemId: t.itemId,
        itemName: item?.name,
        categoryName: item?.category.name,
        quantityConsumed: consumedQty,
        estimatedCost: cost,
      };
    }).sort((a, b) => b.quantityConsumed - a.quantityConsumed);

    // Fast vs Slow Moving (Top 5 vs Bottom 5)
    const fastMoving = consumptionTrends.slice(0, 5);
    const slowMoving = consumptionTrends.slice(-5).reverse();

    // Turnover ratios (COGS / Average Inventory)
    // I am using the current inventory value as a proxy for Average Inventory (I apologize)
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { branchId, deletedAt: null },
      select: { quantity: true, costPerUnit: true },
    });

    const currentInventoryValue = allItems.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0);
    const totalCostOfGoodsConsumed = consumptionTrends.reduce((sum, i) => sum + i.estimatedCost, 0);
    const turnoverRatio = currentInventoryValue > 0 ? (totalCostOfGoodsConsumed / currentInventoryValue) : 0;

    return {
      period: { start, end },
      totalCostOfGoodsConsumed,
      currentInventoryValue,
      turnoverRatio,
      consumptionTrends,
      fastMoving,
      slowMoving,
    };
  }
}
