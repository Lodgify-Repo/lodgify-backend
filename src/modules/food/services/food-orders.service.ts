import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateFoodOrderDto } from '../dto/food.dto';
import { DomainError } from '@/common/domain/error';
import { FoodErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class FoodOrdersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createOrder(branchId: string, guestId: string, dto: CreateFoodOrderDto) {
    let roomNumber = dto.roomNumber;

    // F-F07: Room-Booking Link — Validate booking and auto-fill room number
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { room: true },
      });

      if (!booking) throw new BadRequestException('Booking not found');
      if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
        throw new BadRequestException('Cannot place order on a cancelled or no-show booking');
      }

      // Auto-fill room number from booking
      if (!roomNumber && booking.room) {
        roomNumber = booking.room.roomNumber;
      }

      // F-F07: Pre-arrival ordering validation
      const now = new Date();
      if (booking.checkInDate > now && dto.deliveryType !== 'SCHEDULED') {
        throw new BadRequestException('Pre-arrival orders must use SCHEDULED delivery with a time after check-in');
      }
    }

    // F-F07: Bill-to-room requires a booking
    if (dto.paymentMethod === 'BILL_TO_ROOM' && !dto.bookingId) {
      throw new BadRequestException('Bill-to-room requires a valid booking ID');
    }

    // Calculate order total, applying daily specials where applicable
    let totalAmount = 0;
    const orderItemsData: any[] = [];
    const now = new Date();

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem || menuItem.deletedAt) {
        throw new DomainError(FoodErrorCodes.MENU_ITEM_NOT_FOUND);
      }
      if (!menuItem.isAvailable || menuItem.availability === 'OUT_OF_STOCK') {
        throw new BadRequestException(`"${menuItem.name}" is currently unavailable`);
      }

      // Check for active daily special pricing
      const special = await this.prisma.dailySpecial.findFirst({
        where: {
          menuItemId: item.menuItemId,
          branchId,
          isActive: true,
          startsAt: { lte: now },
          expiresAt: { gte: now },
        },
      });

      const effectivePrice = special ? special.promotionalPrice : menuItem.price;
      const subtotal = effectivePrice * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        subtotal,
        notes: item.notes,
      });
    }

    // Build allergy alert from guest profile
    const guest = await this.prisma.user.findUnique({
      where: { id: guestId },
      select: { dietaryPreferences: true, allergyNotes: true, firstName: true, lastName: true },
    });

    let specialNotes = dto.specialNotes || '';
    if (guest?.allergyNotes) {
      specialNotes = `⚠️ ALLERGY ALERT: ${guest.allergyNotes}. ${specialNotes}`.trim();
    }

    const order = await this.prisma.foodOrder.create({
      data: {
        branchId,
        guestId,
        bookingId: dto.bookingId,
        tableNumber: dto.tableNumber,
        roomNumber,
        deliveryType: dto.deliveryType || 'ASAP',
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
        paymentMethod: dto.paymentMethod,
        totalAmount,
        specialNotes,
        items: { create: orderItemsData },
      },
      include: { items: { include: { menuItem: true } } },
    });

    // Emit event for kitchen notification
    EventBus.emit('food_order:created', { orderId: order.id }, 'FoodOrdersService');

    return order;
  }

  async getOrders(branchId: string, status?: string) {
    const where: any = { branchId };
    if (status) where.status = status;

    return await this.prisma.foodOrder.findMany({
      where,
      include: {
        items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
        guest: { select: { firstName: true, lastName: true } },
        booking: { select: { id: true, room: { select: { roomNumber: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        guest: { select: { firstName: true, lastName: true, dietaryPreferences: true, allergyNotes: true } },
        booking: { select: { id: true, room: { select: { roomNumber: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
