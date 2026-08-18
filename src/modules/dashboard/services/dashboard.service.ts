import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class DashboardService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAdminStats() {
    const totalHotels = await this.prisma.hotel.count();
    const totalUsers = await this.prisma.user.count();
    const totalRevenue = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    });

    return {
      totalHotels,
      totalUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  async getHotelStats(ownerId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: true },
    });

    if (!hotel) return { totalBranches: 0, totalBookings: 0, revenue: 0 };

    const branchIds = hotel.branches.map(b => b.id);
    const totalBookings = await this.prisma.booking.count({
      where: { branchId: { in: branchIds } },
    });

    const revenue = await this.prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { branchId: { in: branchIds }, status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] } },
    });

    return {
      totalBranches: branchIds.length,
      totalBookings,
      revenue: revenue._sum.totalAmount || 0,
    };
  }
}
