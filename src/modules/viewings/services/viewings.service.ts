import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { ScheduleSaleViewingDto, UpdateViewingStatusExtendedDto } from '../dto/viewings-extended.dto';
import { DomainError } from '@/common/domain/error';
import { ViewingErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class ViewingsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private static readonly CONFLICT_WINDOW_MS = 60 * 60 * 1000; 

  // F-PS06: Schedule Viewing (Private Showing, Open House, Virtual Tour)
  async schedule(userId: string, scheduleDto: ScheduleSaleViewingDto) {
    const scheduledDate = new Date(scheduleDto.date);

    if (scheduledDate.getTime() <= Date.now()) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_INVALID_DATE,
        'Viewing date must be in the future',
      );
    }

    const property = await this.prisma.property.findUnique({
      where: { id: scheduleDto.propertyId },
      include: { owner: true },
    });
    if (!property) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_PROPERTY_NOT_FOUND,
        `Property ${scheduleDto.propertyId} not found`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_USER_NOT_FOUND,
        `User ${userId} not found`,
      );
    }

    // If it's a private showing, prevent overlap conflict
    if (scheduleDto.viewingType !== 'OPEN_HOUSE') {
      const windowStart = new Date(scheduledDate.getTime() - ViewingsService.CONFLICT_WINDOW_MS);
      const windowEnd = new Date(scheduledDate.getTime() + ViewingsService.CONFLICT_WINDOW_MS);

      const conflict = await this.prisma.viewingAppointment.findFirst({
        where: {
          propertyId: scheduleDto.propertyId,
          viewingType: 'PRIVATE_SHOWING',
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledDate: { gte: windowStart, lte: windowEnd },
        },
      });

      if (conflict) {
        throw new DomainError(
          ViewingErrorCodes.SLOT_UNAVAILABLE,
          `Property already has a private showing scheduled around this time (${conflict.scheduledDate.toISOString()})`,
        );
      }
    }

    const viewing = await this.prisma.viewingAppointment.create({
      data: {
        userId,
        propertyId: scheduleDto.propertyId,
        clientName: `${user.firstName} ${user.lastName}`,
        clientEmail: user.email,
        clientPhone: user.phone || '',
        scheduledDate,
        viewingType: scheduleDto.viewingType || 'PRIVATE_SHOWING',
        hostType: scheduleDto.hostType || 'OWNER',
        hostId: scheduleDto.hostId,
        notes: scheduleDto.notes,
        status: 'SCHEDULED',
      },
      include: {
        property: { select: { title: true, address: true, city: true } },
      },
    });

    EventBus.emit('property:viewing_requested', { viewingId: viewing.id }, 'ViewingsService');

    return viewing;
  }

  // F-PS06: Get buyer's scheduled viewings
  async getMyViewings(userId: string) {
    return await this.prisma.viewingAppointment.findMany({
      where: { userId },
      include: { property: { select: { id: true, title: true, address: true, city: true, askingPrice: true, price: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // F-PS06: Get property owner's scheduled viewings for their properties
  async getOwnerViewings(ownerId: string) {
    return await this.prisma.viewingAppointment.findMany({
      where: { property: { ownerId } },
      include: {
        property: { select: { id: true, title: true, city: true } },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // F-PS06: Get agent viewings
  async getAgentViewings(userId: string) {
    return await this.prisma.viewingAppointment.findMany({
      where: {
        OR: [
          { agent: { userId } },
          { property: { authorizations: { some: { agent: { userId }, status: 'APPROVED' } } } },
        ],
      },
      include: {
        property: { select: { id: true, title: true, city: true } },
        user: { select: { firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // F-PS06: Review / Reschedule / Complete viewing appointment
  async updateStatus(id: string, updateDto: UpdateViewingStatusExtendedDto) {
    const viewing = await this.prisma.viewingAppointment.findUnique({ where: { id } });
    if (!viewing) {
      throw new DomainError(ViewingErrorCodes.VIEWING_NOT_FOUND);
    }

    const data: any = {
      status: updateDto.status,
      feedback: updateDto.feedback,
    };

    if (updateDto.newScheduledDate) {
      data.scheduledDate = new Date(updateDto.newScheduledDate);
    }

    return await this.prisma.viewingAppointment.update({
      where: { id },
      data,
      include: { property: { select: { title: true } } },
    });
  }
}
