import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/bookings.dto';
import { DomainError } from '@/common/domain/error';
import { BookingErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class BookingsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(guestId: string, createBookingDto: CreateBookingDto) {
    const { branchId, roomId, checkInDate, checkOutDate, guestsCount, specialRequests } = createBookingDto;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn.getTime() <= Date.now()) {
      throw new DomainError(BookingErrorCodes.INVALID_DATES, 'Check-in date must be in the future');
    }

    if (checkOut.getTime() <= checkIn.getTime()) {
      throw new DomainError(BookingErrorCodes.INVALID_DATES, 'Check-out date must be after check-in date');
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!branch) {
      throw new DomainError(BookingErrorCodes.BRANCH_NOT_FOUND, `Branch ${branchId} not found`);
    }

    // Validate room if provided
    let roomType: { basePrice: number; pricingRules: Array<{ modifierType: string; modifierValue: number; startDate: Date; endDate: Date; isActive: boolean }> } | null = null;

    if (roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: {
          roomType: {
            include: {
              pricingRules: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!room) {
        throw new DomainError(BookingErrorCodes.ROOM_NOT_FOUND, `Room ${roomId} not found`);
      }

      if (room.roomType.branchId !== branchId) {
        throw new DomainError(BookingErrorCodes.ROOM_NOT_FOUND, 'Room does not belong to the specified branch');
      }

      if (room.status !== 'AVAILABLE') {
        throw new DomainError(BookingErrorCodes.ROOM_UNAVAILABLE, `Room ${room.roomNumber} is currently ${room.status}`);
      }

      roomType = room.roomType;
    }

    // Calculate price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    let totalAmount: number;

    if (roomType) {
      totalAmount = this.calculatePrice(roomType.basePrice, nights, checkIn, checkOut, roomType.pricingRules);
    } else {
      // No room specified — default price will be set when room is assigned
      totalAmount = 0;
    }

    // Availability check + create inside a transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      if (roomId) {
        const overlapping = await tx.booking.findFirst({
          where: {
            roomId,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
          select: { id: true },
        });

        if (overlapping) {
          throw new DomainError(
            BookingErrorCodes.ROOM_UNAVAILABLE,
            'Room is already booked for the requested dates',
            { conflictingBookingId: overlapping.id },
          );
        }
      }

      return await tx.booking.create({
        data: {
          guestId,
          branchId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestsCount,
          totalAmount,
          specialRequests,
        },
      });
    });

    EventBus.emit('booking:confirmed', { bookingId: booking.id, hotelId: branchId }, 'BookingsService');

    return booking;
  }

  async findByGuest(guestId: string) {
    return await this.prisma.booking.findMany({
      where: { guestId },
      include: {
        branch: { select: { name: true } },
        room: { select: { roomNumber: true } }
      }
    });
  }

  async findByBranch(branchId: string) {
    return await this.prisma.booking.findMany({
      where: { branchId },
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
      data: { status: updateBookingStatusDto.status },
    });
  }

  /**
   * Calculates the total price for a stay. Applies only the highest active pricing rule 
   * (the one that results in the greatest absolute difference from the base price) 
   * that overlaps with the booking dates.
   */
  private calculatePrice(
    basePrice: number,
    nights: number,
    checkIn: Date,
    checkOut: Date,
    pricingRules: Array<{ modifierType: string; modifierValue: number; startDate: Date; endDate: Date; isActive: boolean }>,
  ): number {
    const baseTotal = basePrice * nights;
    let finalTotal = baseTotal;
    let maxDiff = 0;

    // Apply active rules that overlap the stay dates
    const applicableRules = pricingRules.filter(
      (rule) => rule.isActive && rule.startDate <= checkOut && rule.endDate >= checkIn,
    );

    // Find the rule with the highest absolute modifier effect (largest surge or largest discount)
    for (const rule of applicableRules) {
      let currentRuleTotal = baseTotal;
      
      if (rule.modifierType === 'PERCENTAGE') {
        currentRuleTotal = baseTotal * (1 + rule.modifierValue / 100);
      } else if (rule.modifierType === 'FIXED_AMOUNT') {
        currentRuleTotal = baseTotal + (rule.modifierValue * nights);
      }

      const diff = Math.abs(currentRuleTotal - baseTotal);
      if (diff > maxDiff) {
        maxDiff = diff;
        finalTotal = currentRuleTotal;
      }
    }

    return Math.round(finalTotal * 100) / 100; // round to 2 decimal places
  }
}
