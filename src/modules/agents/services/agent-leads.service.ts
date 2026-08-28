import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  CreateLeadDto,
  UpdateLeadStatusDto,
  ScheduleViewingDto,
  ReviewViewingDto,
} from '../dto/agents-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class AgentLeadsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-AG07: Create Lead in Agent Pipeline
  async createLead(userId: string, dto: CreateLeadDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const lead = await this.prisma.lead.create({
      data: {
        agentId: profile.id,
        propertyId: dto.propertyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source || 'MANUAL',
        estimatedValue: dto.estimatedValue,
        notes: dto.notes,
        status: 'NEW',
        stageHistory: [
          {
            stage: 'NEW',
            timestamp: new Date().toISOString(),
            notes: dto.notes || 'Lead created',
          },
        ] as any,
      },
      include: {
        property: { select: { id: true, title: true, price: true, city: true } },
      },
    });

    return lead;
  }

  // F-AG07: Update Lead Pipeline Stage
  async updateLeadStatus(userId: string, leadId: string, dto: UpdateLeadStatusDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.agentId !== profile.id) throw new BadRequestException('Unauthorized');

    const existingHistory = Array.isArray(lead.stageHistory) ? (lead.stageHistory as any[]) : [];
    const updatedHistory = [
      ...existingHistory,
      {
        stage: dto.status,
        timestamp: new Date().toISOString(),
        notes: dto.notes,
      },
    ];

    return await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : lead.notes,
        stageHistory: updatedHistory as any,
      },
      include: {
        property: { select: { title: true, city: true } },
      },
    });
  }

  // F-AG07: Get Agent Leads Pipeline
  async getAgentLeads(userId: string, status?: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const where: any = { agentId: profile.id };
    if (status) where.status = status;

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, price: true, city: true } },
        viewings: { orderBy: { scheduledDate: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute pipeline counts summary
    const counts = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { agentId: profile.id },
      _count: { id: true },
    });

    const pipelineSummary: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      VIEWING_SCHEDULED: 0,
      NEGOTIATING: 0,
      CLOSED_WON: 0,
      CLOSED_LOST: 0,
    };
    counts.forEach(c => {
      pipelineSummary[c.status] = c._count.id;
    });

    return {
      pipelineSummary,
      totalLeads: leads.length,
      leads,
    };
  }

  // F-AG08: Agent Schedules Property Viewing for Prospect
  async scheduleViewing(userId: string, dto: ScheduleViewingDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    const viewing = await this.prisma.viewingAppointment.create({
      data: {
        propertyId: dto.propertyId,
        agentId: profile.id,
        leadId: dto.leadId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        scheduledDate: new Date(dto.scheduledDate),
        notes: dto.notes,
        status: 'SCHEDULED',
      },
      include: {
        property: { select: { title: true, address: true, city: true } },
      },
    });

    // If associated with a lead, auto-advance lead status to VIEWING_SCHEDULED
    if (dto.leadId) {
      await this.updateLeadStatus(userId, dto.leadId, {
        status: 'VIEWING_SCHEDULED',
        notes: `Viewing scheduled for ${dto.scheduledDate}`,
      }).catch(err => this.logger.warn(`Failed to auto-advance lead status: ${err.message}`));
    }

    // Emit event for calendar notification
    EventBus.emit('property:viewing_requested', {
      viewingId: viewing.id,
    }, 'AgentLeadsService');

    return viewing;
  }

  // F-AG08: Owner or Agent Reviews/Updates Viewing Status
  async reviewViewing(viewingId: string, dto: ReviewViewingDto) {
    const viewing = await this.prisma.viewingAppointment.findUnique({
      where: { id: viewingId },
      include: { property: true },
    });

    if (!viewing) throw new NotFoundException('Viewing appointment not found');

    const data: any = {
      status: dto.status,
      feedback: dto.feedback,
    };
    if (dto.newScheduledDate) {
      data.scheduledDate = new Date(dto.newScheduledDate);
    }

    return await this.prisma.viewingAppointment.update({
      where: { id: viewingId },
      data,
      include: {
        property: { select: { title: true, address: true } },
      },
    });
  }

  // F-AG08: Get Agent's Scheduled Viewings
  async getAgentViewings(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    return await this.prisma.viewingAppointment.findMany({
      where: { agentId: profile.id },
      include: {
        property: { select: { id: true, title: true, address: true, city: true } },
        lead: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}
