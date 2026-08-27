import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D03 — Revenue Reports
 * Revenue breakdown by branch, room type, food sales, date range.
 * Net revenue after cancellations.
 */
@Injectable()
export class RevenueReportsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getRevenueReport(
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
        revenueByBranch: [],
        revenueByRoomType: [],
        foodSalesRevenue: 0,
        grossRevenue: 0,
        cancellationRefunds: 0,
        netRevenue: 0,
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

    const paymentDateFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const bookingDateFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Revenue by branch
    const revenueByBranch = await Promise.all(
      hotel.branches
        .filter((b) => branchIds.includes(b.id))
        .map(async (branch) => {
          const payments = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: 'SUCCESS',
              booking: { branchId: branch.id },
              ...paymentDateFilter,
            },
          });

          const foodRevenue = await this.prisma.foodOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
              branchId: branch.id,
              status: { in: ['DELIVERED', 'READY'] },
              ...bookingDateFilter,
            },
          });

          return {
            branchId: branch.id,
            branchName: branch.name,
            roomRevenue: payments._sum.amount || 0,
            foodRevenue: foodRevenue._sum.totalAmount || 0,
            totalRevenue: (payments._sum.amount || 0) + (foodRevenue._sum.totalAmount || 0),
          };
        }),
    );

    // Revenue by room type
    const roomTypes = await this.prisma.roomType.findMany({
      where: { branchId: { in: branchIds }, deletedAt: null },
      select: { id: true, name: true, branchId: true },
    });

    const revenueByRoomType = await Promise.all(
      roomTypes.map(async (rt) => {
        const bookingRevenue = await this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            booking: {
              room: { roomTypeId: rt.id },
            },
            ...paymentDateFilter,
          },
        });

        return {
          roomTypeId: rt.id,
          roomTypeName: rt.name,
          revenue: bookingRevenue._sum.amount || 0,
        };
      }),
    );

    // Food sales revenue
    const foodSalesTotal = await this.prisma.foodOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        branchId: { in: branchIds },
        status: { in: ['DELIVERED', 'READY'] },
        ...bookingDateFilter,
      },
    });

    // Gross revenue (all successful payments)
    const grossPayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        booking: { branchId: { in: branchIds } },
        ...paymentDateFilter,
      },
    });

    // Cancellation refunds
    const refunds = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'REFUNDED',
        booking: { branchId: { in: branchIds } },
        ...paymentDateFilter,
      },
    });

    const grossRevenue = (grossPayments._sum.amount || 0) + (foodSalesTotal._sum.totalAmount || 0);
    const cancellationRefunds = refunds._sum.amount || 0;

    return {
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      revenueByBranch,
      revenueByRoomType,
      foodSalesRevenue: foodSalesTotal._sum.totalAmount || 0,
      grossRevenue,
      cancellationRefunds,
      netRevenue: grossRevenue - cancellationRefunds,
    };
  }
}
