import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateUserStatusDto, VerifyAgentDto } from '../dto/admin.dto';
import { DomainError } from '@/common/domain/error';
import { AdminErrorCodes } from '../errors';

@Injectable()
export class AdminService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      where: this.commonQueries.notDeleted,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(AdminErrorCodes.TARGET_NOT_FOUND);
    }
    
    return await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.status === 'ACTIVE' },
    });
  }

  async getPendingAgents() {
    return await this.prisma.agentProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
  }

  async verifyAgent(agentProfileId: string, dto: VerifyAgentDto) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { id: agentProfileId } });
    if (!profile) {
      throw new DomainError(AdminErrorCodes.TARGET_NOT_FOUND);
    }

    return await this.prisma.agentProfile.update({
      where: { id: agentProfileId },
      data: { status: dto.status },
    });
  }

  async getSystemLogs() {
    // Basic implementation; a real one might read from a central log store like Elasticsearch
    return {
      message: 'System logs feature to be integrated with centralized logging.'
    };
  }
}
