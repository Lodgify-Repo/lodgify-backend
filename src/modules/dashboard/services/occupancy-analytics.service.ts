import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D02 — Occupancy Analytics
 * Charts showing occupancy trends by branch over selectable periods.
 */
@Injectable()
export class OccupancyAnalyticsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getOccupancyTrends(
    ownerId: string,
    branchId?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string,
  ) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: { select: { id: true, name: true } } },
    });

    if (!hotel) return { branches: [], trends: [] };

    let branches = hotel.branches;
    if (branchId) {
      branches = branches.filter((b) => b.id === branchId);
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const trends: Array<{
      branchId: string;
      branchName: string;
      data: Array<{ date: string; occupancyRate: number; occupiedRooms: number; totalRooms: number }>;
    }> = [];

    for (const branch of branches) {
      const totalRooms = await this.prisma.room.count({
        where: {
          roomType: { branchId: branch.id },
          deletedAt: null,
        },
      });

      if (totalRooms === 0) {
        trends.push({ branchId: branch.id, branchName: branch.name, data: [] });
        continue;
      }

      // Get all bookings overlapping the date range for this branch
      const bookings = await this.prisma.booking.findMany({
        where: {
          branchId: branch.id,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkInDate: { lte: end },
          checkOutDate: { gte: start },
        },
        select: { checkInDate: true, checkOutDate: true },
      });

      const dataPoints = this.generateDataPoints(start, end, period, bookings, totalRooms);
      trends.push({ branchId: branch.id, branchName: branch.name, data: dataPoints });
    }

    return {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      trends,
    };
  }

  private generateDataPoints(
    start: Date,
    end: Date,
    period: 'daily' | 'weekly' | 'monthly',
    bookings: Array<{ checkInDate: Date; checkOutDate: Date }>,
    totalRooms: number,
  ) {
    const dataPoints: Array<{ date: string; occupancyRate: number; occupiedRooms: number; totalRooms: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      const periodEnd = this.getPeriodEnd(current, period);
      const effectiveEnd = periodEnd > end ? end : periodEnd;

      // Count how many bookings overlap this period
      let occupiedRooms = 0;
      for (const booking of bookings) {
        if (booking.checkInDate <= effectiveEnd && booking.checkOutDate >= current) {
          occupiedRooms++;
        }
      }

      // Cap at totalRooms (multiple bookings can't exceed room count)
      occupiedRooms = Math.min(occupiedRooms, totalRooms);

      dataPoints.push({
        date: current.toISOString().split('T')[0],
        occupancyRate: Math.round((occupiedRooms / totalRooms) * 10000) / 100,
        occupiedRooms,
        totalRooms,
      });

      // Advance to next period
      this.advancePeriod(current, period);
    }

    return dataPoints;
  }

  private getPeriodEnd(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const end = new Date(date);
    switch (period) {
      case 'daily':
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // last day of current month
        end.setHours(23, 59, 59, 999);
        break;
    }
    return end;
  }

  private advancePeriod(date: Date, period: 'daily' | 'weekly' | 'monthly') {
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        break;
    }
  }
}
