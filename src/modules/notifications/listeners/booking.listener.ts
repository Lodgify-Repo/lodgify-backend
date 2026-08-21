import { Injectable, OnModuleInit } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class BookingListener implements OnModuleInit {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
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

      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'booking_confirmation', {
        emails: [
          {
            to: booking.guest.email,
            subject: `Booking Confirmed - ${booking.branch.name}`,
            html,
          }
        ],
        tag: 'booking_confirmation',
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
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

      await this.queueService.addJob(EMAIL_QUEUE_NAME, 'booking_cancellation', {
        emails: [
          {
            to: booking.guest.email,
            subject: `Booking Cancelled - ${booking.branch.name}`,
            html,
          }
        ],
        tag: 'booking_cancellation',
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }
}
