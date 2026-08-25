import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateAgentProfileDto, UpdateAgentProfileDto, SubmitAgentVerificationDto } from '../dto/agents.dto';
import { DomainError } from '@/common/domain/error';
import { AgentErrorCodes } from '../errors';
import { Role } from '@prisma/client';

@Injectable()
export class AgentsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createProfile(userId: string, createDto: CreateAgentProfileDto) {
    const existing = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new DomainError(AgentErrorCodes.USER_ALREADY_AGENT);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.agentProfile.create({
        data: {
          ...createDto,
          userId,
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

  async getProfile(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new DomainError(AgentErrorCodes.AGENT_NOT_FOUND);
    }

    return profile;
  }

  async updateProfile(userId: string, updateDto: UpdateAgentProfileDto) {
    const profile = await this.getProfile(userId);

    return await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: updateDto,
    });
  }

  async submitVerification(userId: string, dto: SubmitAgentVerificationDto) {
    const profile = await this.getProfile(userId);
    return await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: {
        licenseUrl: dto.licenseUrl,
        companyRegistrationUrl: dto.companyRegistrationUrl,
        status: 'PENDING',
      },
    });
  }

  async verifyAgent(agentId: string, status: string) {
    return await this.prisma.agentProfile.update({
      where: { id: agentId },
      data: { status },
    });
  }

  async getAllAgents() {
    return await this.prisma.agentProfile.findMany({
      where: { status: 'VERIFIED' },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }
}
