import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  CreateAgentProfileExtendedDto,
  UpdateAgentProfileExtendedDto,
  SubmitAgentVerificationDto,
  VerifyAgentDto,
  AgentDirectoryQueryDto,
  CreateAgentReviewDto,
} from '../dto/agents-extended.dto';
import { DomainError } from '@/common/domain/error';
import { AgentErrorCodes } from '../errors';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class AgentsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-AG01: Agent Profile Creation (Individual & Company)
  async createProfile(userId: string, createDto: CreateAgentProfileExtendedDto) {
    const existing = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new DomainError(AgentErrorCodes.USER_ALREADY_AGENT);
    }

    const { bankAccountDetails, socialLinks, ...data } = createDto;

    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.agentProfile.create({
        data: {
          ...data,
          userId,
          bankAccountDetails: bankAccountDetails as any,
          socialLinks: socialLinks as any,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: Role.AGENT },
      });

      return profile;
    }, { maxWait: 10000, timeout: 30000 });

    return result;
  }

  // F-AG01: Get Current Agent Profile
  async getProfile(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        reviews: {
          include: { reviewer: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { authorizations: true, leads: true, commissions: true },
        },
      },
    });

    if (!profile) {
      throw new DomainError(AgentErrorCodes.AGENT_NOT_FOUND);
    }

    return profile;
  }

  // F-AG01: Update Agent Profile
  async updateProfile(userId: string, updateDto: UpdateAgentProfileExtendedDto) {
    const profile = await this.getProfile(userId);
    const { bankAccountDetails, socialLinks, ...data } = updateDto;

    return await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        bankAccountDetails: bankAccountDetails !== undefined ? (bankAccountDetails as any) : undefined,
        socialLinks: socialLinks !== undefined ? (socialLinks as any) : undefined,
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  // F-AG02: Submit Verification Documents
  async submitVerification(userId: string, dto: SubmitAgentVerificationDto) {
    const profile = await this.getProfile(userId);
    return await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: {
        licenseUrl: dto.licenseUrl,
        companyRegistrationUrl: dto.companyRegistrationUrl,
        idDocumentUrl: dto.idDocumentUrl,
        status: 'PENDING',
      },
    });
  }

  // F-AG02: Admin Review Workflow & Verification Badge
  async verifyAgent(agentId: string, dto: VerifyAgentDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { id: agentId } });
    if (!profile) throw new NotFoundException('Agent profile not found');

    const isVerified = dto.status === 'VERIFIED';

    return await this.prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        status: dto.status,
        isVerified,
        tier: dto.tier || profile.tier,
        verificationNotes: dto.verificationNotes,
      },
    });
  }

  // F-AG12: Public Agent Directory Search
  async getAgentDirectory(queryDto: AgentDirectoryQueryDto) {
    const {
      query,
      specialization,
      area,
      accountType,
      verifiedOnly = true,
      page = 1,
      limit = 20,
    } = queryDto;

    const where: Prisma.AgentProfileWhereInput = {};

    if (verifiedOnly) {
      where.status = 'VERIFIED';
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (query) {
      where.OR = [
        { agencyName: { contains: query, mode: 'insensitive' } },
        { licenseNumber: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (specialization) {
      where.specializations = { has: specialization };
    }

    if (area) {
      where.areasServed = { has: area };
    }

    const [total, agents] = await Promise.all([
      this.prisma.agentProfile.count({ where }),
      this.prisma.agentProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true, phone: true } },
          _count: { select: { authorizations: true, reviews: true } },
        },
        orderBy: [{ rating: 'desc' }, { totalSales: 'desc' }],
      }),
    ]);

    return {
      data: agents.map(a => ({
        id: a.id,
        name: a.accountType === 'COMPANY' && a.agencyName ? a.agencyName : `${a.user.firstName} ${a.user.lastName}`,
        individualName: `${a.user.firstName} ${a.user.lastName}`,
        agencyName: a.agencyName,
        accountType: a.accountType,
        licenseNumber: a.licenseNumber,
        bio: a.bio,
        photoUrl: a.photoUrl || a.user.avatarUrl,
        specializations: a.specializations,
        areasServed: a.areasServed,
        yearsOfExperience: a.yearsOfExperience,
        website: a.website,
        isVerified: a.isVerified,
        tier: a.tier,
        rating: a.rating,
        reviewCount: a.reviewCount,
        authorizedPropertiesCount: a._count.authorizations,
        contactEmail: a.user.email,
        contactPhone: a.user.phone,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // F-AG12: Submit Client Review for Agent
  async createAgentReview(agentId: string, reviewerId: string, dto: CreateAgentReviewDto) {
    const agent = await this.prisma.agentProfile.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent profile not found');

    const overallRating = parseFloat(
      ((dto.professionalism + dto.marketKnowledge + dto.responsiveness) / 3).toFixed(2)
    );

    const review = await this.prisma.agentReview.create({
      data: {
        agentId,
        reviewerId,
        professionalism: dto.professionalism,
        marketKnowledge: dto.marketKnowledge,
        responsiveness: dto.responsiveness,
        overallRating,
        comment: dto.comment,
      },
      include: {
        reviewer: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Recompute average agent rating
    const allReviews = await this.prisma.agentReview.findMany({
      where: { agentId },
      select: { overallRating: true },
    });

    const reviewCount = allReviews.length;
    const avgRating = parseFloat(
      (allReviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount).toFixed(2)
    );

    await this.prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        rating: avgRating,
        reviewCount,
      },
    });

    return review;
  }

  // Legacy support for basic getAllAgents
  async getAllAgents() {
    return await this.prisma.agentProfile.findMany({
      where: { status: 'VERIFIED' },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }
}
