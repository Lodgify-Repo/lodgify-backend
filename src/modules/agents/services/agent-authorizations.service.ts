import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  RequestPropertyAuthorizationDto,
  ReviewAuthorizationRequestDto,
  InviteAgentDto,
} from '../dto/agents-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class AgentAuthorizationsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-AG03: Agent Requests Property Authorization
  async requestAuthorization(userId: string, dto: RequestPropertyAuthorizationDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');
    if (!profile.isVerified && profile.status !== 'VERIFIED') {
      throw new BadRequestException('Agent must be verified to request property authorization');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Check existing authorization
    const existing = await this.prisma.agentAuthorization.findUnique({
      where: {
        agentId_propertyId: {
          agentId: profile.id,
          propertyId: dto.propertyId,
        },
      },
    });

    if (existing && existing.status === 'APPROVED') {
      throw new BadRequestException('You are already authorized to represent this property');
    }

    const referralCode = `AG-${property.city.slice(0, 3).toUpperCase()}-${profile.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const authorization = await this.prisma.agentAuthorization.upsert({
      where: {
        agentId_propertyId: {
          agentId: profile.id,
          propertyId: dto.propertyId,
        },
      },
      update: {
        pitchMessage: dto.pitchMessage,
        proposedRate: dto.proposedRate || profile.commissionRate,
        status: 'PENDING',
        declineReason: null,
      },
      create: {
        agentId: profile.id,
        propertyId: dto.propertyId,
        pitchMessage: dto.pitchMessage,
        proposedRate: dto.proposedRate || profile.commissionRate,
        referralCode,
        status: 'PENDING',
      },
      include: {
        property: { select: { title: true, address: true, city: true } },
      },
    });

    return authorization;
  }

  // F-AG04: Property Owner Reviews Authorization Request
  async reviewAuthorization(ownerId: string, authorizationId: string, dto: ReviewAuthorizationRequestDto) {
    const authorization = await this.prisma.agentAuthorization.findUnique({
      where: { id: authorizationId },
      include: { property: true, agent: { include: { user: true } } },
    });

    if (!authorization) throw new NotFoundException('Authorization request not found');
    if (authorization.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    const newStatus = dto.decision === 'APPROVED' ? 'APPROVED' : 'DECLINED';
    const agreedRate = dto.decision === 'APPROVED' ? (dto.agreedRate || authorization.proposedRate || 5.0) : undefined;

    const updated = await this.prisma.agentAuthorization.update({
      where: { id: authorizationId },
      data: {
        status: newStatus,
        agreedRate,
        declineReason: dto.decision === 'DECLINED' ? dto.declineReason : undefined,
      },
      include: {
        property: { select: { title: true } },
        agent: { include: { user: { select: { email: true, firstName: true } } } },
      },
    });

    if (newStatus === 'APPROVED') {
      EventBus.emit('agent_auth:granted', {
        agentEmail: updated.agent.user.email,
        agentName: updated.agent.user.firstName,
        propertyName: updated.property.title,
      }, 'AgentAuthorizationsService');
    }

    return updated;
  }

  // F-AG04: Owner Revokes Agent Authorization
  async revokeAuthorization(ownerId: string, authorizationId: string) {
    const authorization = await this.prisma.agentAuthorization.findUnique({
      where: { id: authorizationId },
      include: { property: true, agent: { include: { user: true } } },
    });

    if (!authorization) throw new NotFoundException('Authorization not found');
    if (authorization.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    const updated = await this.prisma.agentAuthorization.update({
      where: { id: authorizationId },
      data: { status: 'REVOKED' },
    });

    EventBus.emit('agent_auth:revoked', {
      agentEmail: authorization.agent.user.email,
      agentName: authorization.agent.user.firstName,
      propertyName: authorization.property.title,
    }, 'AgentAuthorizationsService');

    return updated;
  }

  // F-AG04: Get All Authorized Agents for a Property (Owner view)
  async getPropertyAgents(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.agentAuthorization.findMany({
      where: { propertyId },
      include: {
        agent: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // F-AG04 & F-AG12: Owner Invites Agent to Represent Listing
  async inviteAgent(ownerId: string, dto: InviteAgentDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    const agent = await this.prisma.agentProfile.findUnique({ where: { id: dto.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    return await this.prisma.agentInvitation.create({
      data: {
        propertyId: dto.propertyId,
        ownerId,
        agentId: dto.agentId,
        proposedRate: dto.proposedRate || agent.commissionRate,
        message: dto.message,
      },
      include: {
        property: { select: { title: true, city: true } },
        agent: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  // F-AG05: Agent Portfolio View (all authorized listings)
  async getAgentPortfolio(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const authorizations = await this.prisma.agentAuthorization.findMany({
      where: { agentId: profile.id },
      include: {
        property: {
          include: {
            owner: { select: { firstName: true, lastName: true, email: true, phone: true } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { bookings: true, inquiries: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return authorizations.map(auth => ({
      authorizationId: auth.id,
      status: auth.status,
      agreedRate: auth.agreedRate || auth.proposedRate,
      referralCode: auth.referralCode,
      createdAt: auth.createdAt,
      property: {
        id: auth.property.id,
        title: auth.property.title,
        type: auth.property.type,
        listingType: auth.property.listingType,
        price: auth.property.price,
        nightlyRate: auth.property.nightlyRate,
        city: auth.property.city,
        state: auth.property.state,
        status: auth.property.status,
        thumbnail: auth.property.images[0]?.url || null,
        performance: {
          views: auth.property.viewsCount,
          inquiries: auth.property._count.inquiries,
          bookings: auth.property._count.bookings,
        },
        owner: auth.property.owner,
      },
    }));
  }

  // F-AG06: Referral Link Generation with Social/Email/SMS Templates
  async generateReferralLink(userId: string, propertyId: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const auth = await this.prisma.agentAuthorization.findUnique({
      where: {
        agentId_propertyId: {
          agentId: profile.id,
          propertyId,
        },
      },
      include: {
        property: true,
      },
    });

    if (!auth || auth.status !== 'APPROVED') {
      throw new BadRequestException('You do not have an approved authorization for this property');
    }

    const baseUrl = process.env.FRONTEND_URL;
    const referralUrl = `${baseUrl}/properties/${propertyId}?ref=${auth.referralCode}`;

    return {
      propertyId,
      propertyTitle: auth.property.title,
      referralCode: auth.referralCode,
      referralUrl,
      agreedCommissionRate: `${auth.agreedRate}%`,
      shareTemplates: {
        whatsapp: `Check out this amazing property: ${auth.property.title} in ${auth.property.city}! View details here: ${referralUrl}`,
        email: {
          subject: `Exclusive Property Listing: ${auth.property.title}`,
          body: `Hello,\n\nI would love to share this exclusive listing with you:\n${auth.property.title} in ${auth.property.city}, ${auth.property.state}.\n\nPrice: NGN ${auth.property.price.toLocaleString()}\n\nView full gallery and book a viewing here:\n${referralUrl}\n\nBest regards,\n${profile.agencyName || 'Your Real Estate Agent'}`,
        },
        sms: `Exclusive listing: ${auth.property.title} in ${auth.property.city}. Click to view & book viewing: ${referralUrl}`,
        socialTwitter: `Looking for premium property in ${auth.property.city}? Check out ${auth.property.title}: ${referralUrl} #RealEstate #NigeriaProperty`,
      },
    };
  }
}
