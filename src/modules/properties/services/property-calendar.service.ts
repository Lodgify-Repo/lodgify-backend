import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { BlockCalendarDatesDto } from '../dto/properties-extended.dto';

@Injectable()
export class PropertyCalendarService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P03: Get Visual Calendar (booked, blocked, available ranges)
  async getAvailabilityCalendar(propertyId: string, startDate?: string, endDate?: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months ahead

    // Fetch active bookings
    const bookings = await this.prisma.propertyBooking.findMany({
      where: {
        propertyId,
        status: { in: ['ACCEPTED', 'PAID', 'CHECKED_IN', 'PENDING'] },
        checkOutDate: { gte: start },
        checkInDate: { lte: end },
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
        status: true,
      },
    });

    // Fetch manual owner blocks
    const blockedDates = await this.prisma.propertyBlockedDate.findMany({
      where: {
        propertyId,
        endDate: { gte: start },
        startDate: { lte: end },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        source: true,
      },
    });

    return {
      propertyId,
      windowStart: start,
      windowEnd: end,
      minStayNights: property.minStayNights,
      instantBookable: property.instantBookable,
      bookedRanges: bookings.map(b => ({
        id: b.id,
        startDate: b.checkInDate,
        endDate: b.checkOutDate,
        type: b.status === 'PENDING' ? 'PENDING' : 'BOOKED',
      })),
      blockedRanges: blockedDates.map(b => ({
        id: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        reason: b.reason,
        source: b.source,
        type: 'BLOCKED',
      })),
    };
  }

  // F-P03: Block Dates (Owner)
  async blockDates(propertyId: string, ownerId: string, dto: BlockCalendarDatesDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    return await this.prisma.propertyBlockedDate.create({
      data: {
        propertyId,
        startDate,
        endDate,
        reason: dto.reason || 'Blocked by owner',
        source: 'MANUAL',
      },
    });
  }

  // F-P03: Unblock Dates (Owner)
  async unblockDates(blockId: string, ownerId: string) {
    const block = await this.prisma.propertyBlockedDate.findUnique({
      where: { id: blockId },
      include: { property: true },
    });
    if (!block) throw new NotFoundException('Block record not found');
    if (block.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.propertyBlockedDate.delete({ where: { id: blockId } });
  }

  // F-P03: RFC 5545 iCal Stream Generator
  async generateICalStream(propertyId: string): Promise<string> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: {
          where: { status: { in: ['ACCEPTED', 'PAID', 'CHECKED_IN'] } },
        },
        blockedDates: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const formatDateToICal = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const formatDateToDay = (date: Date): string => {
      return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lodgify HMS//Property Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${property.title} Availability`,
    ];

    // Export confirmed bookings
    for (const booking of property.bookings) {
      ics.push(
        'BEGIN:VEVENT',
        `UID:booking-${booking.id}@lodgify.app`,
        `DTSTAMP:${formatDateToICal(new Date())}`,
        `DTSTART;VALUE=DATE:${formatDateToDay(booking.checkInDate)}`,
        `DTEND;VALUE=DATE:${formatDateToDay(booking.checkOutDate)}`,
        `SUMMARY:Reserved - Booking #${booking.id.slice(0, 8)}`,
        `DESCRIPTION:Confirmed guest reservation via Lodgify`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    }

    // Export manual blocks
    for (const block of property.blockedDates) {
      ics.push(
        'BEGIN:VEVENT',
        `UID:block-${block.id}@lodgify.app`,
        `DTSTAMP:${formatDateToICal(new Date())}`,
        `DTSTART;VALUE=DATE:${formatDateToDay(block.startDate)}`,
        `DTEND;VALUE=DATE:${formatDateToDay(block.endDate)}`,
        `SUMMARY:Blocked - ${block.reason || 'Not Available'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    }

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }
}
