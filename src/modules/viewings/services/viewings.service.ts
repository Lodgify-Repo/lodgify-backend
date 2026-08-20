import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { ScheduleViewingDto, UpdateViewingStatusDto } from '../dto/viewings.dto';
import { DomainError } from '@/common/domain/error';
import { ViewingErrorCodes } from '../errors';

@Injectable()
export class ViewingsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private static readonly CONFLICT_WINDOW_MS = 60 * 60 * 1000; 

  async schedule(userId: string, scheduleDto: ScheduleViewingDto) {
    const scheduledDate = new Date(scheduleDto.date);

    // Reject dates in the past
    if (scheduledDate.getTime() <= Date.now()) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_INVALID_DATE,
        'Viewing date must be in the future',
      );
    }

    // Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: scheduleDto.propertyId },
      select: { id: true },
    });
    if (!property) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_PROPERTY_NOT_FOUND,
        `Property ${scheduleDto.propertyId} not found`,
      );
    }

    // Validate user exists (no silent guest fallback — if a userId is provided it must be real)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(
        ViewingErrorCodes.VIEWING_USER_NOT_FOUND,
        `User ${userId} not found`,
      );
    }

    // Conflict check + create inside a serializable transaction to prevent race conditions
    const windowStart = new Date(scheduledDate.getTime() - ViewingsService.CONFLICT_WINDOW_MS);
    const windowEnd = new Date(scheduledDate.getTime() + ViewingsService.CONFLICT_WINDOW_MS);

    return await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.viewingAppointment.findFirst({
        where: {
          propertyId: scheduleDto.propertyId,
          status: { not: 'CANCELLED' },
          scheduledDate: { gte: windowStart, lte: windowEnd },
        },
        select: { id: true, scheduledDate: true },
      });

      if (conflict) {
        throw new DomainError(
          ViewingErrorCodes.SLOT_UNAVAILABLE,
          `Property already has a viewing scheduled at ${conflict.scheduledDate.toISOString()}`,
          { conflictingViewingId: conflict.id, conflictingDate: conflict.scheduledDate },
        );
      }

      return await tx.viewingAppointment.create({
        data: {
          userId,
          clientName: `${user.firstName} ${user.lastName}`,
          clientEmail: user.email,
          clientPhone: user.phone || '',
          propertyId: scheduleDto.propertyId,
          scheduledDate,
          notes: scheduleDto.notes,
        },
      });
    });
  }

  async getMyViewings(userId: string) {
    return await this.prisma.viewingAppointment.findMany({
      where: { userId },
      include: { property: { select: { title: true, address: true } } },
    });
  }

  async getAgentViewings(agentId: string) {
    return await this.prisma.viewingAppointment.findMany({
      where: { property: { authorizations: { some: { agentId } } } },
      include: {
        property: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async updateStatus(id: string, updateDto: UpdateViewingStatusDto) {
    const viewing = await this.prisma.viewingAppointment.findUnique({ where: { id } });
    if (!viewing) {
      throw new DomainError(ViewingErrorCodes.VIEWING_NOT_FOUND);
    }

    return await this.prisma.viewingAppointment.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }
}
