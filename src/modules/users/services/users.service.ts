import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { DomainError } from '@/common/domain/error';
import { UserErrorCodes } from '../errors';

@Injectable()
export class UsersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, ...this.commonQueries.notDeleted },
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
      where: { id: userId, ...this.commonQueries.notDeleted },
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
}
