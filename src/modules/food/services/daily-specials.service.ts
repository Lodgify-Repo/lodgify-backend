import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateDailySpecialDto } from '../dto/food-extended.dto';

@Injectable()
export class DailySpecialsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(branchId: string, dto: CreateDailySpecialDto) {
    return await this.prisma.dailySpecial.create({
      data: {
        branchId,
        menuItemId: dto.menuItemId,
        promotionalPrice: dto.promotionalPrice,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
      },
      include: { menuItem: { select: { name: true, price: true, imageUrl: true } } },
    });
  }

  async getActiveSpecials(branchId: string) {
    const now = new Date();
    return await this.prisma.dailySpecial.findMany({
      where: {
        branchId,
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      include: {
        menuItem: { select: { name: true, price: true, imageUrl: true, photos: true, dietaryTags: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllSpecials(branchId: string) {
    return await this.prisma.dailySpecial.findMany({
      where: { branchId },
      include: {
        menuItem: { select: { name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string) {
    const special = await this.prisma.dailySpecial.findUnique({ where: { id } });
    if (!special) throw new NotFoundException('Daily special not found');

    return await this.prisma.dailySpecial.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
