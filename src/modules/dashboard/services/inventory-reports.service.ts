import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D08 — Inventory Reports
 * Stock levels, consumption trends, reorder recommendations,
 * supplier spend analysis.
 */
@Injectable()
export class InventoryReportsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getInventoryReport(
    ownerId: string,
    branchId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: { select: { id: true, name: true } } },
    });

    if (!hotel) {
      return {
        stockLevels: [],
        consumptionTrends: [],
        reorderRecommendations: [],
        supplierSpendAnalysis: [],
      };
    }

    let branchIds = hotel.branches.map((b) => b.id);
    if (branchId) {
      branchIds = branchIds.filter((id) => id === branchId);
    }

    const [stockLevels, consumptionTrends, reorderRecommendations, supplierSpendAnalysis] =
      await Promise.all([
        this.getStockLevels(branchIds),
        this.getConsumptionTrends(branchIds, startDate, endDate),
        this.getReorderRecommendations(branchIds),
        this.getSupplierSpendAnalysis(branchIds, startDate, endDate),
      ]);

    return {
      stockLevels,
      consumptionTrends,
      reorderRecommendations,
      supplierSpendAnalysis,
    };
  }

  private async getStockLevels(branchIds: string[]) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        branchId: { in: branchIds },
        deletedAt: null,
      },
      include: {
        category: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: [{ branchId: 'asc' }, { categoryId: 'asc' }],
    });

    // Group by category
    const byCategory: Record<string, { categoryName: string; items: any[]; totalValue: number }> = {};
    for (const item of items) {
      const catName = item.category.name;
      if (!byCategory[catName]) {
        byCategory[catName] = { categoryName: catName, items: [], totalValue: 0 };
      }
      const itemValue = item.quantity * (item.costPerUnit || 0);
      byCategory[catName].items.push({
        id: item.id,
        name: item.name,
        sku: item.sku,
        branch: item.branch.name,
        quantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold,
        costPerUnit: item.costPerUnit,
        totalValue: itemValue,
        status: item.quantity <= 0
          ? 'OUT_OF_STOCK'
          : item.quantity <= item.minThreshold
            ? 'LOW_STOCK'
            : 'IN_STOCK',
      });
      byCategory[catName].totalValue += itemValue;
    }

    return Object.values(byCategory);
  }

  private async getConsumptionTrends(branchIds: string[], startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        type: 'OUT',
        item: { branchId: { in: branchIds }, deletedAt: null },
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : { gte: defaultStart },
      },
      include: {
        item: { select: { name: true, unit: true, category: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by item name and aggregate daily consumption
    const consumptionMap: Record<string, { itemName: string; unit: string; category: string; dailyData: Record<string, number>; totalConsumed: number }> = {};

    for (const txn of transactions) {
      const key = txn.item.name;
      if (!consumptionMap[key]) {
        consumptionMap[key] = {
          itemName: txn.item.name,
          unit: txn.item.unit,
          category: txn.item.category.name,
          dailyData: {},
          totalConsumed: 0,
        };
      }
      const dateKey = txn.createdAt.toISOString().split('T')[0];
      consumptionMap[key].dailyData[dateKey] = (consumptionMap[key].dailyData[dateKey] || 0) + txn.quantity;
      consumptionMap[key].totalConsumed += txn.quantity;
    }

    return Object.values(consumptionMap).map((item) => ({
      itemName: item.itemName,
      unit: item.unit,
      category: item.category,
      totalConsumed: item.totalConsumed,
      dailyConsumption: Object.entries(item.dailyData)
        .map(([date, qty]) => ({ date, quantity: qty }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  private async getReorderRecommendations(branchIds: string[]) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        branchId: { in: branchIds },
        deletedAt: null,
      },
      include: {
        category: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    // Filter items that need reordering
    return items
      .filter((item) => item.quantity <= item.minThreshold)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        branch: item.branch.name,
        category: item.category.name,
        currentQuantity: item.quantity,
        minThreshold: item.minThreshold,
        reorderQuantity: item.reorderQuantity || item.minThreshold * 2,
        unit: item.unit,
        estimatedCost: (item.reorderQuantity || item.minThreshold * 2) * (item.costPerUnit || 0),
        urgency: item.quantity <= 0 ? 'CRITICAL' : item.quantity <= item.minThreshold * 0.5 ? 'HIGH' : 'MEDIUM',
      }))
      .sort((a, b) => {
        const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
        return (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
      });
  }

  private async getSupplierSpendAnalysis(branchIds: string[], startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        branchId: { in: branchIds },
        status: { in: ['ISSUED', 'PARTIAL', 'FULFILLED'] },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true, contactName: true } },
        items: {
          select: { quantity: true, unitPrice: true, total: true },
        },
      },
    });

    // Group by supplier
    const supplierMap: Record<string, { supplierId: string; supplierName: string; contactName: string | null; totalSpend: number; orderCount: number; itemCount: number }> = {};

    for (const po of purchaseOrders) {
      const key = po.supplierId;
      if (!supplierMap[key]) {
        supplierMap[key] = {
          supplierId: po.supplier.id,
          supplierName: po.supplier.name,
          contactName: po.supplier.contactName,
          totalSpend: 0,
          orderCount: 0,
          itemCount: 0,
        };
      }
      supplierMap[key].totalSpend += po.totalAmount;
      supplierMap[key].orderCount += 1;
      supplierMap[key].itemCount += po.items.length;
    }

    return Object.values(supplierMap).sort((a, b) => b.totalSpend - a.totalSpend);
  }
}
