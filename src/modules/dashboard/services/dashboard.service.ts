import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D01 — Owner Dashboard
 * Overview: arrivals/departures, occupancy rate, revenue (rooms + food),
 * inventory alerts, pending bookings.
 */
@Injectable()
export class DashboardService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /** F-D01: Full owner dashboard overview */
  async getOwnerDashboard(ownerId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: { select: { id: true } } },
    });

    if (!hotel) {
      return {
        todayArrivals: [],
        todayDepartures: [],
        occupancyRate: 0,
        roomRevenue: 0,
        foodRevenue: 0,
        totalRevenue: 0,
        inventoryAlerts: [],
        pendingBookings: [],
      };
    }

    const branchIds = hotel.branches.map((b) => b.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayArrivals,
      todayDepartures,
      occupancyData,
      roomRevenue,
      foodRevenue,
      inventoryAlerts,
      pendingBookings,
    ] = await Promise.all([
      // Today's arrivals: confirmed bookings checking in today
      this.prisma.booking.findMany({
        where: {
          branchId: { in: branchIds },
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { roomNumber: true } },
          branch: { select: { name: true } },
        },
        orderBy: { checkInDate: 'asc' },
      }),

      // Today's departures: checked-in bookings checking out today
      this.prisma.booking.findMany({
        where: {
          branchId: { in: branchIds },
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['CHECKED_IN', 'CONFIRMED'] },
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { roomNumber: true } },
          branch: { select: { name: true } },
        },
        orderBy: { checkOutDate: 'asc' },
      }),

      // Occupancy: count occupied rooms vs total rooms
      this.getOccupancyRate(branchIds),

      // Room revenue: sum of booking payments with SUCCESS status
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          booking: { branchId: { in: branchIds } },
        },
      }),

      // Food revenue: sum of completed food orders
      this.prisma.foodOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          branchId: { in: branchIds },
          status: { in: ['DELIVERED', 'READY'] },
        },
      }),

      // Inventory alerts: items at or below threshold
      this.prisma.inventoryItem.findMany({
        where: {
          branchId: { in: branchIds },
          deletedAt: null,
        },
        include: {
          category: { select: { name: true } },
          branch: { select: { name: true } },
        },
      }).then((items) => items.filter((item) => item.quantity <= item.minThreshold)),

      // Pending bookings
      this.prisma.booking.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'PENDING',
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { roomNumber: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const roomRevenueTotal = roomRevenue._sum.amount || 0;
    const foodRevenueTotal = foodRevenue._sum.totalAmount || 0;

    return {
      todayArrivals,
      todayDepartures,
      occupancyRate: occupancyData,
      roomRevenue: roomRevenueTotal,
      foodRevenue: foodRevenueTotal,
      totalRevenue: roomRevenueTotal + foodRevenueTotal,
      inventoryAlerts,
      pendingBookings,
    };
  }

  /** Admin stats (preserved from original) */
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

  /** Calculate occupancy rate across branches */
  private async getOccupancyRate(branchIds: string[]) {
    const totalRooms = await this.prisma.room.count({
      where: {
        roomType: { branchId: { in: branchIds } },
        deletedAt: null,
      },
    });

    if (totalRooms === 0) return { rate: 0, occupiedRooms: 0, totalRooms: 0 };

    const occupiedRooms = await this.prisma.room.count({
      where: {
        roomType: { branchId: { in: branchIds } },
        deletedAt: null,
        status: 'OCCUPIED',
      },
    });

    return {
      rate: Math.round((occupiedRooms / totalRooms) * 10000) / 100, // e.g. 75.50
      occupiedRooms,
      totalRooms,
    };
  }
}
