import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/infra/database/prisma.service';
import { MailService } from '@/infra/mail/mail.service';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class ReminderCron {
  private readonly logger = Logger.getInstance('mail');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCheckinReminders() {
    this.logger.info('Running hourly check-in reminder job');

    const now = new Date();
    const next24hStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkInDate: {
          gte: next24hStart,
          lt: next24hEnd,
        },
      },
      include: {
        guest: true,
        branch: true,
        room: true,
      },
    });

    if (upcomingBookings.length === 0) {
      this.logger.info('No upcoming bookings for check-in reminder');
      return;
    }

    this.logger.info(`Found ${upcomingBookings.length} bookings for check-in reminders`);

    for (const booking of upcomingBookings) {
      try {
        const guestHtml = this.mailService.compileTemplate('checkin_reminder', {
          bookingId: booking.id,
          guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
          branchName: booking.branch.name,
          branchAddress: booking.branch.address,
          checkInDate: booking.checkInDate.toLocaleDateString(),
          checkOutDate: booking.checkOutDate.toLocaleDateString(),
          roomNumber: booking.room?.roomNumber,
          year: new Date().getFullYear(),
        });

        await this.queueService.addJob(EMAIL_QUEUE_NAME, 'checkin_reminder', {
          emails: [
            {
              to: booking.guest.email,
              subject: `Reminder: Upcoming Stay at ${booking.branch.name}`,
              html: guestHtml,
            }
          ],
          tag: 'checkin_reminder',
        });
      } catch (err) {
        this.logger.error(`Failed to dispatch check-in reminder for booking ${booking.id}`, err);
      }
    }
  }
}
