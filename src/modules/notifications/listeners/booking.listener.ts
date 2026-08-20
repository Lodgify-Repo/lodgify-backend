import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class BookingListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    EventBus.on('booking:confirmed', this.handleBookingConfirmed.bind(this), 'BookingListener');
    EventBus.on('booking:cancelled', this.handleBookingCancelled.bind(this), 'BookingListener');
  }

  async handleBookingConfirmed(payload: { bookingId: string; hotelId: string }) {
    this.logger.info(`Received booking:confirmed for ${payload.bookingId}`);
    
    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { guest: true, branch: true, room: true },
    });

    if (booking) {
      const html = this.mailService.compileTemplate('booking_confirmation', {
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        branchName: booking.branch.name,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        checkOutDate: booking.checkOutDate.toLocaleDateString(),
        roomNumber: booking.room?.roomNumber,
        guestsCount: booking.guestsCount,
        totalAmount: booking.totalAmount.toLocaleString(),
        specialRequests: booking.specialRequests,
        year: new Date().getFullYear(),
      });

      await this.mailService.sendBulk([
        {
          to: booking.guest.email,
          subject: `Booking Confirmed - ${booking.branch.name}`,
          html,
        }
      ], 'booking_confirmation');
    }
  }

  async handleBookingCancelled(payload: { bookingId: string; reason?: string }) {
    this.logger.info(`Received booking:cancelled for ${payload.bookingId}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { guest: true, branch: true },
    });

    if (booking) {
      const html = this.mailService.compileTemplate('booking_cancellation', {
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        branchName: booking.branch.name,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        checkOutDate: booking.checkOutDate.toLocaleDateString(),
        reason: payload.reason,
        year: new Date().getFullYear(),
      });

      await this.mailService.sendBulk([
        {
          to: booking.guest.email,
          subject: `Booking Cancelled - ${booking.branch.name}`,
          html,
        }
      ], 'booking_cancellation');
    }
  }
}
