import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateMenuCategoryDto, UpdateMenuCategoryDto } from '../dto/food-extended.dto';

@Injectable()
export class MenuCategoriesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(branchId: string, dto: CreateMenuCategoryDto) {
    return await this.prisma.menuCategory.create({
      data: {
        branchId,
        name: dto.name,
        description: dto.description,
        availableFrom: dto.availableFrom,
        availableTo: dto.availableTo,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(branchId: string) {
    return await this.prisma.menuCategory.findMany({
      where: { branchId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async update(id: string, dto: UpdateMenuCategoryDto) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Menu category not found');

    return await this.prisma.menuCategory.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Menu category not found');

    return await this.prisma.menuCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
