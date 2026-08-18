import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateMenuItemDto, CreateFoodOrderDto } from '../dto/food.dto';
import { DomainError } from '@/common/domain/error';
import { FoodErrorCodes } from '../errors';

@Injectable()
export class FoodService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createMenuItem(createDto: CreateMenuItemDto) {
    return await this.prisma.menuItem.create({
      data: createDto,
    });
  }

  async getMenuItemsByCategory(categoryId: string) {
    return await this.prisma.menuItem.findMany({
      where: { categoryId, ...this.commonQueries.notDeleted },
    });
  }

  async createOrder(branchId: string, createDto: CreateFoodOrderDto) {
    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of createDto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        throw new DomainError(FoodErrorCodes.MENU_ITEM_NOT_FOUND);
      }
      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        subtotal,
        notes: item.notes,
      });
    }

    return await this.prisma.foodOrder.create({
      data: {
        branchId,
        bookingId: createDto.bookingId,
        tableNumber: createDto.tableNumber,
        specialNotes: createDto.specialNotes,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });
  }

  async getOrders(branchId: string) {
    return await this.prisma.foodOrder.findMany({
      where: { branchId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
