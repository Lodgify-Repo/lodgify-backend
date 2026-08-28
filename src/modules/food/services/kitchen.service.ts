import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateOrderStatusDto } from '../dto/food-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class KitchenService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-F05: Kitchen display — active orders grouped by room for same-time delivery
  async getKitchenDisplay(branchId: string) {
    const activeOrders = await this.prisma.foodOrder.findMany({
      where: {
        branchId,
        status: { in: ['PENDING', 'RECEIVED', 'PREPARING', 'READY'] },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, preparationTime: true, dietaryTags: true } },
          },
        },
        guest: { select: { firstName: true, lastName: true, allergyNotes: true, dietaryPreferences: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group orders by room number for simultaneous delivery
    const byRoom: Record<string, typeof activeOrders> = {};
    const ungrouped: typeof activeOrders = [];

    for (const order of activeOrders) {
      const key = order.roomNumber || order.tableNumber;
      if (key) {
        if (!byRoom[key]) byRoom[key] = [];
        byRoom[key].push(order);
      } else {
        ungrouped.push(order);
      }
    }

    return {
      totalActiveOrders: activeOrders.length,
      byRoom,
      ungrouped,
    };
  }

  // F-F06: Update order status through the kitchen workflow
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.foodOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['RECEIVED', 'CANCELLED'],
      RECEIVED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const updated = await this.prisma.foodOrder.update({
      where: { id: orderId },
      data: {
        status: dto.status as any,
        estimatedDeliveryTime: dto.estimatedDeliveryTime,
      },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        guest: { select: { firstName: true, lastName: true } },
      },
    });

    // Emit status change event for guest notification
    EventBus.emit('food_order:status_changed', {
      orderId: updated.id,
      status: dto.status,
    }, 'KitchenService');

    return updated;
  }

  // F-F06: Guest-facing order tracking
  async trackOrder(orderId: string, guestId: string) {
    const order = await this.prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.guestId !== guestId) throw new BadRequestException('Order does not belong to this guest');

    return {
      id: order.id,
      status: order.status,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      roomNumber: order.roomNumber,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
