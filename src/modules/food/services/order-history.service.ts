import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { ReorderDto } from '../dto/food-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class OrderHistoryService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-F11: Guest order history
  async getGuestOrderHistory(guestId: string, branchId?: string) {
    const where: any = { guestId };
    if (branchId) where.branchId = branchId;

    return await this.prisma.foodOrder.findMany({
      where,
      include: {
        items: {
          include: { menuItem: { select: { name: true, imageUrl: true, price: true } } },
        },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // F-F11: Reorder — clone a past order with optional quantity modifications
  async reorder(guestId: string, dto: ReorderDto) {
    const originalOrder = await this.prisma.foodOrder.findUnique({
      where: { id: dto.originalOrderId },
      include: {
        items: { include: { menuItem: true } },
      },
    });

    if (!originalOrder) throw new NotFoundException('Original order not found');
    if (originalOrder.guestId !== guestId) {
      throw new BadRequestException('This order does not belong to you');
    }

    // Build modified items map
    const modifiedMap = new Map(
      (dto.modifiedItems || []).map(m => [m.menuItemId, m.quantity])
    );

    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of originalOrder.items) {
      // Skip if menu item has been deleted
      if (item.menuItem.deletedAt || !item.menuItem.isAvailable) continue;

      const quantity = modifiedMap.has(item.menuItemId) ? modifiedMap.get(item.menuItemId)! : item.quantity;
      if (quantity <= 0) continue; // Skip items with 0 quantity

      // Check for active daily special pricing
      const now = new Date();
      const special = await this.prisma.dailySpecial.findFirst({
        where: {
          menuItemId: item.menuItemId,
          branchId: originalOrder.branchId,
          isActive: true,
          startsAt: { lte: now },
          expiresAt: { gte: now },
        },
      });

      const effectivePrice = special ? special.promotionalPrice : item.menuItem.price;
      const subtotal = effectivePrice * quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity,
        unitPrice: effectivePrice,
        subtotal,
        notes: item.notes,
      });
    }

    if (orderItemsData.length === 0) {
      throw new BadRequestException('No available items to reorder');
    }

    const newOrder = await this.prisma.foodOrder.create({
      data: {
        branchId: originalOrder.branchId,
        guestId,
        bookingId: originalOrder.bookingId,
        roomNumber: originalOrder.roomNumber,
        tableNumber: originalOrder.tableNumber,
        deliveryType: originalOrder.deliveryType,
        paymentMethod: originalOrder.paymentMethod,
        totalAmount,
        specialNotes: originalOrder.specialNotes,
        items: { create: orderItemsData },
      },
      include: { items: { include: { menuItem: true } } },
    });

    EventBus.emit('food_order:created', { orderId: newOrder.id }, 'OrderHistoryService');

    return newOrder;
  }
}
