import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/food.dto';

@Injectable()
export class MenuItemsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(dto: CreateMenuItemDto) {
    return await this.prisma.menuItem.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        photos: dto.photos || [],
        dietaryTags: dto.dietaryTags || [],
        availability: dto.availability || 'IN_STOCK',
        preparationTime: dto.preparationTime,
      },
      include: { category: { select: { name: true } } },
    });
  }

  async findByCategory(categoryId: string) {
    return await this.prisma.menuItem.findMany({
      where: { categoryId, deletedAt: null },
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, branchId: true } },
        recipe: {
          include: { inventoryItem: { select: { name: true, unit: true, quantity: true } } },
        },
      },
    });
    if (!item || item.deletedAt) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('Menu item not found');

    return await this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: { select: { name: true } } },
    });
  }

  async delete(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('Menu item not found');

    return await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  }
}
