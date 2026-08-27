import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D05 — Today's Operations
 * Branch manager view: check-ins, check-outs, cleaning queue, food orders, occupancy.
 */
@Injectable()
export class TodayOperationsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getTodayOperations(branchId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      expectedCheckIns,
      expectedCheckOuts,
      cleaningQueue,
      activeFoodOrders,
      occupancySnapshot,
      completedCheckIns,
      completedCheckOuts,
    ] = await Promise.all([
      // Expected check-ins: confirmed bookings with checkInDate = today
      this.prisma.booking.findMany({
        where: {
          branchId,
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: 'CONFIRMED',
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { roomNumber: true, floor: true } },
        },
        orderBy: { checkInDate: 'asc' },
      }),

      // Expected check-outs: checked-in bookings with checkOutDate = today
      this.prisma.booking.findMany({
        where: {
          branchId,
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: 'CHECKED_IN',
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { roomNumber: true, floor: true } },
        },
        orderBy: { checkOutDate: 'asc' },
      }),

      // Cleaning queue: rooms with CLEANING status
      this.prisma.room.findMany({
        where: {
          roomType: { branchId },
          status: 'CLEANING',
          deletedAt: null,
        },
        include: {
          roomType: { select: { name: true } },
        },
      }),

      // Active food orders: PENDING + PREPARING
      this.prisma.foodOrder.findMany({
        where: {
          branchId,
          status: { in: ['PENDING', 'PREPARING'] },
          createdAt: { gte: todayStart },
        },
        include: {
          items: {
            include: { menuItem: { select: { name: true, preparationTime: true } } },
          },
          booking: { select: { id: true, room: { select: { roomNumber: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Occupancy snapshot
      this.getOccupancySnapshot(branchId),

      // Already checked in today
      this.prisma.booking.count({
        where: {
          branchId,
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: 'CHECKED_IN',
        },
      }),

      // Already checked out today
      this.prisma.booking.count({
        where: {
          branchId,
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: 'CHECKED_OUT',
        },
      }),
    ]);

    return {
      date: todayStart.toISOString().split('T')[0],
      checkIns: {
        expected: expectedCheckIns,
        expectedCount: expectedCheckIns.length,
        completedCount: completedCheckIns,
      },
      checkOuts: {
        expected: expectedCheckOuts,
        expectedCount: expectedCheckOuts.length,
        completedCount: completedCheckOuts,
      },
      cleaningQueue: {
        rooms: cleaningQueue,
        count: cleaningQueue.length,
      },
      foodOrders: {
        active: activeFoodOrders,
        activeCount: activeFoodOrders.length,
      },
      occupancy: occupancySnapshot,
    };
  }

  private async getOccupancySnapshot(branchId: string) {
    const totalRooms = await this.prisma.room.count({
      where: {
        roomType: { branchId },
        deletedAt: null,
      },
    });

    const roomsByStatus = await this.prisma.room.groupBy({
      by: ['status'],
      where: {
        roomType: { branchId },
        deletedAt: null,
      },
      _count: { id: true },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const group of roomsByStatus) {
      statusBreakdown[group.status] = group._count.id;
    }

    const occupied = statusBreakdown['OCCUPIED'] || 0;

    return {
      totalRooms,
      occupiedRooms: occupied,
      availableRooms: statusBreakdown['AVAILABLE'] || 0,
      cleaningRooms: statusBreakdown['CLEANING'] || 0,
      maintenanceRooms: statusBreakdown['MAINTENANCE'] || 0,
      outOfOrderRooms: statusBreakdown['OUT_OF_ORDER'] || 0,
      occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 10000) / 100 : 0,
    };
  }
}
