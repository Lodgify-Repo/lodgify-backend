import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D07 — Agent Dashboard
 * Folio summary, leads pipeline, scheduled viewings, commission
 * earned/pending, recent activity.
 */
@Injectable()
export class AgentDashboardService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAgentDashboard(userId: string) {
    const agentProfile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    if (!agentProfile) {
      return { error: 'Agent profile not found' };
    }

    const [
      leadsPipeline,
      scheduledViewings,
      commissionSummary,
      recentActivity,
      authorizedProperties,
    ] = await Promise.all([
      this.getLeadsPipeline(agentProfile.id),
      this.getScheduledViewings(userId),
      this.getCommissionSummary(agentProfile.id),
      this.getRecentActivity(agentProfile.id, userId),
      this.getAuthorizedProperties(agentProfile.id),
    ]);

    return {
      folioSummary: {
        name: `${agentProfile.user.firstName} ${agentProfile.user.lastName}`,
        email: agentProfile.user.email,
        avatarUrl: agentProfile.user.avatarUrl,
        agencyName: agentProfile.agencyName,
        tier: agentProfile.tier,
        commissionRate: agentProfile.commissionRate,
        totalSales: agentProfile.totalSales,
        status: agentProfile.status,
        memberSince: agentProfile.createdAt,
      },
      leadsPipeline,
      scheduledViewings,
      commissionSummary,
      authorizedProperties,
      recentActivity,
    };
  }

  private async getLeadsPipeline(agentId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { agentId },
      select: { id: true, name: true, email: true, phone: true, status: true, source: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const byStatus: Record<string, number> = {};
    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    }

    return {
      total: leads.length,
      byStatus,
      leads: leads.slice(0, 20), // recent 20
    };
  }

  private async getScheduledViewings(userId: string) {
    const now = new Date();

    const viewings = await this.prisma.viewingAppointment.findMany({
      where: {
        userId,
        scheduledDate: { gte: now },
        status: 'SCHEDULED',
      },
      include: {
        property: {
          select: { id: true, title: true, address: true, city: true, type: true, price: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });

    const pastViewings = await this.prisma.viewingAppointment.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    return {
      upcoming: viewings,
      upcomingCount: viewings.length,
      completedCount: pastViewings,
    };
  }

  private async getCommissionSummary(agentId: string) {
    const commissions = await this.prisma.commissionRecord.findMany({
      where: { agentId },
      select: { amount: true, status: true, transactionType: true, paidAt: true, createdAt: true },
    });

    let totalEarned = 0;
    let totalPending = 0;
    let totalPaid = 0;
    const byType: Record<string, number> = {};

    for (const comm of commissions) {
      if (comm.status === 'PAID') {
        totalPaid += comm.amount;
      } else {
        totalPending += comm.amount;
      }
      totalEarned += comm.amount;
      byType[comm.transactionType] = (byType[comm.transactionType] || 0) + comm.amount;
    }

    return {
      totalEarned,
      totalPaid,
      totalPending,
      byTransactionType: byType,
      recentCommissions: commissions.slice(0, 10),
    };
  }

  private async getAuthorizedProperties(agentId: string) {
    const authorizations = await this.prisma.agentAuthorization.findMany({
      where: { agentId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            type: true,
            listingType: true,
            price: true,
            status: true,
            city: true,
          },
        },
      },
    });

    return authorizations.map((auth) => ({
      authorizationId: auth.id,
      authorizationStatus: auth.status,
      agreedRate: auth.agreedRate,
      property: auth.property,
    }));
  }

  private async getRecentActivity(agentId: string, userId: string) {
    const [recentLeads, recentCommissions, recentViewings] = await Promise.all([
      this.prisma.lead.findMany({
        where: { agentId },
        select: { id: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.commissionRecord.findMany({
        where: { agentId },
        select: { id: true, amount: true, status: true, transactionType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.viewingAppointment.findMany({
        where: { userId },
        select: {
          id: true,
          clientName: true,
          scheduledDate: true,
          status: true,
          property: { select: { title: true } },
        },
        orderBy: { scheduledDate: 'desc' },
        take: 5,
      }),
    ]);

    return {
      recentLeads,
      recentCommissions,
      recentViewings,
    };
  }
}
