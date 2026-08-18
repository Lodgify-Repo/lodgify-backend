import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/bookings.dto';
import { DomainError } from '@/common/domain/error';
import { BookingErrorCodes } from '../errors';
import { EventBus } from '@/common/events/event-bus';

@Injectable()
export class BookingsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(guestId: string, createBookingDto: CreateBookingDto) {
    // 1. Calculate price, check availability, etc.
    const { branchId, roomId, checkInDate, checkOutDate, guestsCount, specialRequests } = createBookingDto;

    // simplistic calculation
    const totalAmount = 50000; 

    const booking = await this.prisma.booking.create({
      data: {
        guestId,
        branchId,
        roomId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        guestsCount,
        totalAmount,
        specialRequests,
      },
    });

    // TODO: use EventBus.getInstance().emit
    // EventBus.getInstance().emit('booking:confirmed', { bookingId: booking.id, hotelId: branchId }, 'BookingsService');

    return booking;
  }

  async findByGuest(guestId: string) {
    return await this.prisma.booking.findMany({
      where: { guestId, ...this.commonQueries.notDeleted },
      include: {
        branch: { select: { name: true } },
        room: { select: { roomNumber: true } }
      }
    });
  }

  async findByBranch(branchId: string) {
    return await this.prisma.booking.findMany({
      where: { branchId, ...this.commonQueries.notDeleted },
      include: {
        guest: { select: { firstName: true, lastName: true, email: true } },
        room: { select: { roomNumber: true } }
      }
    });
  }

  async updateStatus(id: string, updateBookingStatusDto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new DomainError(BookingErrorCodes.BOOKING_NOT_FOUND);
    }

    return await this.prisma.booking.update({
      where: { id },
      data: { status: updateBookingStatusDto.status as any },
    });
  }
}
