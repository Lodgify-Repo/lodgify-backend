import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

/**
 * F-D06 — Property Owner Dashboard
 * Overview: listing performance, inquiries, bookings, offers, agent performance,
 * earnings, folio summary, leads pipeline, scheduled viewings, commission
 * earned/pending, recent activity.
 */
@Injectable()
export class PropertyOwnerDashboardService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getPropertyOwnerDashboard(ownerId: string) {
    const [
      listingPerformance,
      inquiriesSummary,
      offersSummary,
      agentPerformance,
      earnings,
      recentActivity,
    ] = await Promise.all([
      this.getListingPerformance(ownerId),
      this.getInquiriesSummary(ownerId),
      this.getOffersSummary(ownerId),
      this.getAgentPerformance(ownerId),
      this.getEarnings(ownerId),
      this.getRecentActivity(ownerId),
    ]);

    return {
      listingPerformance,
      inquiriesSummary,
      offersSummary,
      agentPerformance,
      earnings,
      recentActivity,
    };
  }

  private async getListingPerformance(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        listingType: true,
        price: true,
        _count: {
          select: {
            inquiries: true,
            offers: true,
            viewings: true,
          },
        },
      },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const prop of properties) {
      statusBreakdown[prop.status] = (statusBreakdown[prop.status] || 0) + 1;
    }

    return {
      totalListings: properties.length,
      statusBreakdown,
      listings: properties.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        type: p.type,
        listingType: p.listingType,
        price: p.price,
        inquiryCount: p._count.inquiries,
        offerCount: p._count.offers,
        viewingCount: p._count.viewings,
      })),
    };
  }

  private async getInquiriesSummary(ownerId: string) {
    const inquiries = await this.prisma.propertyInquiry.findMany({
      where: {
        property: { ownerId },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        name: true,
        property: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStatus: Record<string, number> = {};
    for (const inq of inquiries) {
      byStatus[inq.status] = (byStatus[inq.status] || 0) + 1;
    }

    return {
      total: inquiries.length,
      byStatus,
      recent: inquiries.slice(0, 10),
    };
  }

  private async getOffersSummary(ownerId: string) {
    const offers = await this.prisma.purchaseOffer.findMany({
      where: {
        property: { ownerId },
      },
      select: {
        id: true,
        status: true,
        offerAmount: true,
        buyerName: true,
        createdAt: true,
        property: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStatus: Record<string, number> = {};
    let totalOfferValue = 0;
    for (const offer of offers) {
      byStatus[offer.status] = (byStatus[offer.status] || 0) + 1;
      totalOfferValue += offer.offerAmount;
    }

    return {
      total: offers.length,
      totalOfferValue,
      byStatus,
      recent: offers.slice(0, 10),
    };
  }

  private async getAgentPerformance(ownerId: string) {
    const authorizations = await this.prisma.agentAuthorization.findMany({
      where: {
        property: { ownerId },
        status: 'APPROVED',
      },
      include: {
        agent: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            commissions: {
              select: { amount: true, status: true },
            },
          },
        },
        property: { select: { title: true } },
      },
    });

    // Group by agent
    const agentMap = new Map<string, any>();
    for (const auth of authorizations) {
      if (!agentMap.has(auth.agentId)) {
        const totalCommission = auth.agent.commissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCommission = auth.agent.commissions
          .filter((c) => c.status === 'PAID')
          .reduce((sum, c) => sum + c.amount, 0);

        agentMap.set(auth.agentId, {
          agentId: auth.agentId,
          name: `${auth.agent.user.firstName} ${auth.agent.user.lastName}`,
          email: auth.agent.user.email,
          totalSales: auth.agent.totalSales,
          totalCommission,
          paidCommission,
          pendingCommission: totalCommission - paidCommission,
          properties: [],
        });
      }
      agentMap.get(auth.agentId).properties.push(auth.property.title);
    }

    return Array.from(agentMap.values());
  }

  private async getEarnings(ownerId: string) {
    // Earnings from accepted offers
    const acceptedOffers = await this.prisma.purchaseOffer.aggregate({
      _sum: { offerAmount: true },
      _count: { id: true },
      where: {
        property: { ownerId },
        status: 'ACCEPTED',
      },
    });

    return {
      totalEarnings: acceptedOffers._sum.offerAmount || 0,
      acceptedDeals: acceptedOffers._count.id,
    };
  }

  private async getRecentActivity(ownerId: string) {
    const [recentInquiries, recentOffers, recentViewings] = await Promise.all([
      this.prisma.propertyInquiry.findMany({
        where: { property: { ownerId } },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          property: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.purchaseOffer.findMany({
        where: { property: { ownerId } },
        select: {
          id: true,
          buyerName: true,
          offerAmount: true,
          status: true,
          createdAt: true,
          property: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.viewingAppointment.findMany({
        where: { property: { ownerId } },
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
      recentInquiries,
      recentOffers,
      recentViewings,
    };
  }
}
