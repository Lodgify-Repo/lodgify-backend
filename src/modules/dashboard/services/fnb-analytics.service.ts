import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D09 — F&B Analytics
 * Daily/weekly order counts, revenue by category, top-selling items,
 * preparation time averages.
 */
@Injectable()
export class FnbAnalyticsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getFnbAnalytics(
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
        orderCounts: { daily: [], weekly: [] },
        revenueByCategory: [],
        topSellingItems: [],
        preparationTimeAverages: [],
      };
    }

    let branchIds = hotel.branches.map((b) => b.id);
    if (branchId) {
      branchIds = branchIds.filter((id) => id === branchId);
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Default to last 30 days if no date range specified
    if (!startDate && !endDate) {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      dateFilter.gte = defaultStart;
    }

    const [orderCounts, revenueByCategory, topSellingItems, preparationTimeAverages] =
      await Promise.all([
        this.getOrderCounts(branchIds, dateFilter),
        this.getRevenueByCategory(branchIds, dateFilter),
        this.getTopSellingItems(branchIds, dateFilter),
        this.getPreparationTimeAverages(branchIds, dateFilter),
      ]);

    return {
      orderCounts,
      revenueByCategory,
      topSellingItems,
      preparationTimeAverages,
    };
  }

  private async getOrderCounts(branchIds: string[], dateFilter: any) {
    const orders = await this.prisma.foodOrder.findMany({
      where: {
        branchId: { in: branchIds },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Daily counts
    const dailyMap: Record<string, { date: string; orderCount: number; revenue: number }> = {};
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, orderCount: 0, revenue: 0 };
      }
      dailyMap[dateKey].orderCount++;
      if (['DELIVERED', 'READY'].includes(order.status)) {
        dailyMap[dateKey].revenue += order.totalAmount;
      }
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Weekly counts
    const weeklyMap: Record<string, { weekStart: string; orderCount: number; revenue: number }> = {};
    for (const order of orders) {
      const weekStart = this.getWeekStart(order.createdAt);
      if (!weeklyMap[weekStart]) {
        weeklyMap[weekStart] = { weekStart, orderCount: 0, revenue: 0 };
      }
      weeklyMap[weekStart].orderCount++;
      if (['DELIVERED', 'READY'].includes(order.status)) {
        weeklyMap[weekStart].revenue += order.totalAmount;
      }
    }
    const weekly = Object.values(weeklyMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    return {
      totalOrders: orders.length,
      daily,
      weekly,
    };
  }

  private async getRevenueByCategory(branchIds: string[], dateFilter: any) {
    const orderItems = await this.prisma.foodOrderItem.findMany({
      where: {
        order: {
          branchId: { in: branchIds },
          status: { in: ['DELIVERED', 'READY'] },
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
      },
      include: {
        menuItem: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const categoryMap: Record<string, { categoryId: string; categoryName: string; revenue: number; orderCount: number; itemCount: number }> = {};

    for (const item of orderItems) {
      const catId = item.menuItem.category.id;
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          categoryId: catId,
          categoryName: item.menuItem.category.name,
          revenue: 0,
          orderCount: 0,
          itemCount: 0,
        };
      }
      categoryMap[catId].revenue += item.subtotal;
      categoryMap[catId].orderCount++;
      categoryMap[catId].itemCount += item.quantity;
    }

    return Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
  }

  private async getTopSellingItems(branchIds: string[], dateFilter: any) {
    const orderItems = await this.prisma.foodOrderItem.findMany({
      where: {
        order: {
          branchId: { in: branchIds },
          status: { in: ['DELIVERED', 'READY'] },
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const itemMap: Record<string, { menuItemId: string; name: string; category: string; unitPrice: number; totalQuantity: number; totalRevenue: number }> = {};

    for (const item of orderItems) {
      const key = item.menuItemId;
      if (!itemMap[key]) {
        itemMap[key] = {
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          category: item.menuItem.category.name,
          unitPrice: item.menuItem.price,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      itemMap[key].totalQuantity += item.quantity;
      itemMap[key].totalRevenue += item.subtotal;
    }

    const byQuantity = Object.values(itemMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    const byRevenue = Object.values(itemMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return {
      byQuantity,
      byRevenue,
    };
  }

  private async getPreparationTimeAverages(branchIds: string[], dateFilter: any) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        category: { branchId: { in: branchIds } },
        preparationTime: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        preparationTime: true,
        category: { select: { name: true } },
      },
    });

    // Group by category for average prep time
    const categoryMap: Record<string, { categoryName: string; items: Array<{ name: string; preparationTime: number }>; avgPrepTime: number }> = {};

    for (const item of menuItems) {
      const catName = item.category.name;
      if (!categoryMap[catName]) {
        categoryMap[catName] = { categoryName: catName, items: [], avgPrepTime: 0 };
      }
      categoryMap[catName].items.push({
        name: item.name,
        preparationTime: item.preparationTime!,
      });
    }

    // Calculate averages
    for (const cat of Object.values(categoryMap)) {
      const total = cat.items.reduce((sum, item) => sum + item.preparationTime, 0);
      cat.avgPrepTime = cat.items.length > 0 ? Math.round(total / cat.items.length) : 0;
    }

    return Object.values(categoryMap).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}
