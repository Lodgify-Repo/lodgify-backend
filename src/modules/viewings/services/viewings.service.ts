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

  async schedule(userId: string, scheduleDto: ScheduleViewingDto) {
    // 1. Basic conflict check (omitted for brevity)
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    return await this.prisma.viewingAppointment.create({
      data: {
        userId,
        clientName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
        clientEmail: user?.email || 'guest@lodgify.com',
        clientPhone: user?.phone || '000000000',
        propertyId: scheduleDto.propertyId,
        scheduledDate: new Date(scheduleDto.date),
        notes: scheduleDto.notes,
      },
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
