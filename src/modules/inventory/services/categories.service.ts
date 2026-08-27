import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateInventoryCategoryDto } from '../dto/inventory-extended.dto';

@Injectable()
export class CategoriesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(hotelId: string, createDto: CreateInventoryCategoryDto) {
    return await this.prisma.inventoryCategory.create({
      data: {
        hotelId,
        name: createDto.name,
        description: createDto.description,
      },
    });
  }

  async findAll(hotelId: string) {
    return await this.prisma.inventoryCategory.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, updateDto: Partial<CreateInventoryCategoryDto>) {
    const exists = await this.prisma.inventoryCategory.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Category not found');

    return await this.prisma.inventoryCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.inventoryCategory.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Category not found');

    return await this.prisma.inventoryCategory.delete({
      where: { id },
    });
  }
}
