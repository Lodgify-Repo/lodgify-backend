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
      // 1. Send confirmation to Guest
      const guestHtml = this.mailService.compileTemplate('booking_confirmation', {
        bookingId: booking.id,
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
            html: guestHtml,
          }
        ],
        tag: 'booking_confirmation',
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      // 2. Send New Booking Alert to Staff/Manager (F-N02)
      if (booking.branch.contactEmail) {
        const staffHtml = this.mailService.compileTemplate('new_booking_alert', {
          bookingId: booking.id,
          branchName: booking.branch.name,
          guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
          guestEmail: booking.guest.email,
          checkInDate: booking.checkInDate.toLocaleDateString(),
          checkOutDate: booking.checkOutDate.toLocaleDateString(),
          roomNumber: booking.room?.roomNumber,
          guestsCount: booking.guestsCount,
          totalAmount: booking.totalAmount.toLocaleString(),
          specialRequests: booking.specialRequests,
          year: new Date().getFullYear(),
        });

        await this.queueService.addJob(EMAIL_QUEUE_NAME, 'new_booking_alert', {
          emails: [
            {
              to: booking.branch.contactEmail,
              subject: `New Booking Alert - ${booking.branch.name}`,
              html: staffHtml,
            }
          ],
          tag: 'new_booking_alert',
        });
      }
    }
  }

  async handleBookingCancelled(payload: { bookingId: string; reason?: string }) {
    this.logger.info(`Received booking:cancelled for ${payload.bookingId}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { guest: true, branch: true, payments: true },
    });

    if (booking) {
      // Calculate refund based on successful payments
      const totalPaid = booking.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);

      // 1. Send cancellation to Guest
      const guestHtml = this.mailService.compileTemplate('booking_cancellation', {
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
            html: guestHtml,
          }
        ],
        tag: 'booking_cancellation',
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      // 2. Send Cancellation Alert to Staff/Manager (F-N03)
      if (booking.branch.contactEmail) {
        const staffHtml = this.mailService.compileTemplate('booking_cancellation_staff', {
          bookingId: booking.id,
          branchName: booking.branch.name,
          guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
          guestEmail: booking.guest.email,
          checkInDate: booking.checkInDate.toLocaleDateString(),
          checkOutDate: booking.checkOutDate.toLocaleDateString(),
          refundAmount: totalPaid.toLocaleString(),
          reason: payload.reason,
          year: new Date().getFullYear(),
        });

        await this.queueService.addJob(EMAIL_QUEUE_NAME, 'booking_cancellation_staff', {
          emails: [
            {
              to: booking.branch.contactEmail,
              subject: `Booking Cancelled - ${booking.branch.name}`,
              html: staffHtml,
            }
          ],
          tag: 'booking_cancellation_staff',
        });
      }
    }
  }
}
