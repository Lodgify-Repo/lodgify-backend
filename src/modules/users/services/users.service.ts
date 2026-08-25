import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { DomainError } from '@/common/domain/error';
import { UserErrorCodes } from '../errors';
import { QueueService } from '@/infra/queue/queue.service';
import { EMAIL_QUEUE_NAME } from '@/infra/queue/email.worker';

@Injectable()
export class UsersService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new DomainError(UserErrorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new DomainError(UserErrorCodes.USER_NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteAccount(userId: string) {
    // Soft delete
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { success: true };
  }

  async inviteSubAccount(parentId: string, dto: { email: string, role: Role }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.subAccountInvitation.create({
      data: {
        senderId: parentId,
        email: dto.email,
        role: dto.role,
        token,
        expiresAt,
      },
    });

    const link = existingUser
      ? `https://lodgify.com/invitations/accept?token=${token}`
      : `https://lodgify.com/register?token=${token}`;

    await this.queueService.addJob(EMAIL_QUEUE_NAME, 'invite-subaccount', {
      emails: [
        {
          to: dto.email,
          subject: 'You have been invited to join an organization',
          html: `<h1>Invitation</h1><p>You have been invited to join as a ${dto.role}.</p><p>Click here to accept: <a href="${link}">Accept Invitation</a></p>`,
        }
      ],
      tag: 'users'
    });

    if (existingUser) {
      console.log(`User exists. Send link to accept invitation: /invitations/accept?token=${token}`);
    } else {
      console.log(`User new. Send link to register: /register?token=${token}`);
    }
    
    return invitation;
  }

  async getSubAccounts(parentId: string) {
    return await this.prisma.user.findMany({
      where: { parentId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
  }

  async setSubAccountStatus(parentId: string, subAccountId: string, isActive: boolean) {
    return await this.prisma.user.update({
      where: { id: subAccountId, parentId },
      data: { isActive },
    });
  }

  async removeSubAccount(parentId: string, subAccountId: string) {
    return await this.prisma.user.update({
      where: { id: subAccountId, parentId },
      data: { parentId: null },
    });
  }
}
