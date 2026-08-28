import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { InitiateCommissionPayoutDto } from '../dto/agents-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class AgentCommissionsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-AG09: Auto-calculate and record commission on transaction
  async recordCommission(data: {
    agentId: string;
    propertyId: string;
    bookingId?: string;
    transactionType: 'SALE' | 'RENTAL';
    totalTransactionValue: number;
    referenceId?: string;
  }) {
    const auth = await this.prisma.agentAuthorization.findUnique({
      where: {
        agentId_propertyId: {
          agentId: data.agentId,
          propertyId: data.propertyId,
        },
      },
    });

    const agreedRate = auth?.agreedRate || 5.0;
    const amount = (data.totalTransactionValue * agreedRate) / 100;

    const commission = await this.prisma.commissionRecord.create({
      data: {
        agentId: data.agentId,
        propertyId: data.propertyId,
        bookingId: data.bookingId,
        transactionType: data.transactionType,
        totalTransactionValue: data.totalTransactionValue,
        agreedRate,
        amount,
        status: 'PENDING',
        referenceId: data.referenceId,
      },
      include: {
        property: { select: { title: true, address: true } },
        agent: { include: { user: { select: { email: true, firstName: true } } } },
      },
    });

    // Update total sales on agent profile
    await this.prisma.agentProfile.update({
      where: { id: data.agentId },
      data: {
        totalSales: { increment: data.totalTransactionValue },
      },
    }).catch(err => this.logger.warn(`Failed to increment agent totalSales: ${err.message}`));

    // Emit event
    EventBus.emit('commission:earned', {
      agentEmail: commission.agent.user.email,
      agentName: commission.agent.user.firstName,
      amount,
      reference: commission.id,
    }, 'AgentCommissionsService');

    return commission;
  }

  // F-AG09 & F-AG10: Get Agent Commission Records and Financial Summary
  async getAgentCommissions(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const records = await this.prisma.commissionRecord.findMany({
      where: { agentId: profile.id },
      include: {
        property: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = records.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = records.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);
    const totalPending = records.filter(r => r.status !== 'PAID').reduce((sum, r) => sum + r.amount, 0);

    return {
      financialSummary: {
        totalEarned,
        totalPaid,
        totalPending,
        currency: 'NGN',
      },
      payoutAccount: profile.bankAccountDetails,
      records,
    };
  }

  // F-AG10: Property Owner Initiates Commission Payout
  async initiatePayout(ownerId: string, dto: InitiateCommissionPayoutDto) {
    const commission = await this.prisma.commissionRecord.findUnique({
      where: { id: dto.commissionId },
      include: {
        property: true,
        agent: { include: { user: true } },
      },
    });

    if (!commission) throw new NotFoundException('Commission record not found');
    if (commission.property && commission.property.ownerId !== ownerId) {
      throw new BadRequestException('Unauthorized: You are not the owner of this property');
    }
    if (commission.status === 'PAID') {
      throw new BadRequestException('This commission has already been paid out');
    }

    const reference = dto.payoutReference || `PAYOUT-${Date.now().toString(36).toUpperCase()}`;

    return await this.prisma.commissionRecord.update({
      where: { id: dto.commissionId },
      data: {
        status: 'PAID',
        payoutMethod: dto.payoutMethod,
        payoutReference: reference,
        payoutReceiptUrl: dto.payoutReceiptUrl,
        paidAt: new Date(),
      },
      include: {
        agent: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        property: { select: { title: true } },
      },
    });
  }

  // F-AG10: Generate Downloadable Financial Statement Summary
  async getCommissionStatement(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const records = await this.prisma.commissionRecord.findMany({
      where: { agentId: profile.id },
      include: { property: { select: { title: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statementDate: new Date().toISOString(),
      agent: {
        id: profile.id,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        agencyName: profile.agencyName,
        licenseNumber: profile.licenseNumber,
        email: profile.user.email,
      },
      bankDetails: profile.bankAccountDetails,
      totalCommissionsCount: records.length,
      totalEarned: records.reduce((sum, r) => sum + r.amount, 0),
      totalPaid: records.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0),
      items: records.map(r => ({
        id: r.id,
        date: r.createdAt.toISOString().split('T')[0],
        propertyTitle: r.property?.title || 'Direct Referral',
        transactionType: r.transactionType,
        transactionValue: r.totalTransactionValue,
        agreedRate: `${r.agreedRate}%`,
        commissionAmount: r.amount,
        status: r.status,
        payoutDate: r.paidAt ? r.paidAt.toISOString().split('T')[0] : null,
        payoutReference: r.payoutReference,
      })),
    };
  }

  // F-AG11: Agent Performance Analytics & Leaderboard
  async getAgentAnalytics(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        _count: { select: { authorizations: true, leads: true, commissions: true, viewings: true } },
      },
    });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const [closedWonLeads, totalEarningsResult, allAgents] = await Promise.all([
      this.prisma.lead.count({ where: { agentId: profile.id, status: 'CLOSED_WON' } }),
      this.prisma.commissionRecord.aggregate({
        where: { agentId: profile.id, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.agentProfile.findMany({
        select: { id: true, totalSales: true },
        orderBy: { totalSales: 'desc' },
      }),
    ]);

    const totalLeads = profile._count.leads;
    const conversionRate = totalLeads > 0 ? parseFloat(((closedWonLeads / totalLeads) * 100).toFixed(1)) : 0;
    const totalCommissionsPaid = totalEarningsResult._sum.amount || 0;

    // Leaderboard rank
    const agentRank = allAgents.findIndex(a => a.id === profile.id) + 1;

    return {
      agentId: profile.id,
      ranking: agentRank > 0 ? agentRank : allAgents.length + 1,
      totalAgentsCount: allAgents.length,
      metrics: {
        propertiesRepresented: profile._count.authorizations,
        totalLeads,
        closedWonLeads,
        viewingsScheduled: profile._count.viewings,
        conversionRatePercent: conversionRate,
        totalSalesVolume: profile.totalSales,
        totalCommissionEarned: totalCommissionsPaid,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
      },
    };
  }

  // F-AG11: Agent Leaderboard
  async getLeaderboard(limit: number = 10) {
    const topAgents = await this.prisma.agentProfile.findMany({
      where: { status: 'VERIFIED' },
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { authorizations: true, commissions: true } },
      },
      orderBy: [{ totalSales: 'desc' }, { rating: 'desc' }],
    });

    return topAgents.map((agent, index) => ({
      rank: index + 1,
      id: agent.id,
      name: agent.accountType === 'COMPANY' && agent.agencyName ? agent.agencyName : `${agent.user.firstName} ${agent.user.lastName}`,
      photoUrl: agent.photoUrl || agent.user.avatarUrl,
      tier: agent.tier,
      totalSalesVolume: agent.totalSales,
      rating: agent.rating,
      propertiesCount: agent._count.authorizations,
    }));
  }
}
