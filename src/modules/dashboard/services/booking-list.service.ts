import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * F-D04 / F-D07 — Booking List
 * Sortable, filterable list of all bookings. Exportable to CSV.
 */
@Injectable()
export class BookingListService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getBookingList(
    ownerId: string,
    filters: {
      branchId?: string;
      status?: string;
      guestName?: string;
      startDate?: string;
      endDate?: string;
    },
    sort: { sortBy?: string; sortOrder?: 'asc' | 'desc' },
    pagination: { page: number; limit: number },
  ) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: { select: { id: true } } },
    });

    if (!hotel) return { data: [], total: 0, page: pagination.page, limit: pagination.limit, totalPages: 0 };

    let branchIds = hotel.branches.map((b) => b.id);
    if (filters.branchId) {
      branchIds = branchIds.filter((id) => id === filters.branchId);
    }

    const where: Prisma.BookingWhereInput = {
      branchId: { in: branchIds },
    };

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.guestName) {
      where.guest = {
        OR: [
          { firstName: { contains: filters.guestName, mode: 'insensitive' } },
          { lastName: { contains: filters.guestName, mode: 'insensitive' } },
        ],
      };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as any).gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as any).lte = end;
      }
    }

    const orderBy: any = {};
    const sortField = sort.sortBy || 'createdAt';
    orderBy[sortField] = sort.sortOrder || 'desc';

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
          room: { select: { roomNumber: true, roomType: { select: { name: true } } } },
          branch: { select: { name: true } },
          payments: { select: { amount: true, status: true, method: true } },
        },
        orderBy,
        skip,
        take: pagination.limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /** Export booking list as CSV string */
  async exportToCsv(
    ownerId: string,
    filters: {
      branchId?: string;
      status?: string;
      guestName?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<string> {
    // Fetch all matching bookings (no pagination for export)
    const result = await this.getBookingList(
      ownerId,
      filters,
      { sortBy: 'createdAt', sortOrder: 'desc' },
      { page: 1, limit: 10000 }, // reasonable cap
    );

    const headers = [
      'Booking ID',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Branch',
      'Room Number',
      'Room Type',
      'Check-In Date',
      'Check-Out Date',
      'Guests Count',
      'Total Amount',
      'Status',
      'Created At',
    ];

    const rows = result.data.map((booking: any) => [
      booking.id,
      `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.trim(),
      booking.guest?.email || '',
      booking.guest?.phone || '',
      booking.branch?.name || '',
      booking.room?.roomNumber || 'Unassigned',
      booking.room?.roomType?.name || '',
      new Date(booking.checkInDate).toISOString().split('T')[0],
      new Date(booking.checkOutDate).toISOString().split('T')[0],
      booking.guestsCount,
      booking.totalAmount,
      booking.status,
      new Date(booking.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((field) => {
          const str = String(field);
          // Escape fields containing commas, quotes, or newlines
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(','),
      ),
    ].join('\n');

    return csvContent;
  }
}
