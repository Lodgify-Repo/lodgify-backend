import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { SendPropertyMessageDto } from '../dto/properties-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class PropertyMessagesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P08: Send message between guest and owner
  async sendMessage(propertyId: string, senderId: string, dto: SendPropertyMessageDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // If sender is the owner, receiver is determined by the booking or conversation thread
    // If sender is guest, receiver is the property owner
    let receiverId = property.ownerId;

    if (senderId === property.ownerId) {
      if (dto.bookingId) {
        const booking = await this.prisma.propertyBooking.findUnique({
          where: { id: dto.bookingId },
        });
        if (booking) receiverId = booking.guestId;
      } else {
        // Find latest message in thread to identify guest
        const latestMsg = await this.prisma.propertyMessage.findFirst({
          where: { propertyId, receiverId: senderId },
          orderBy: { createdAt: 'desc' },
        });
        if (latestMsg && latestMsg.senderId !== senderId) {
          receiverId = latestMsg.senderId;
        }
      }
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Sender and receiver cannot be identical');
    }

    const message = await this.prisma.propertyMessage.create({
      data: {
        propertyId,
        senderId,
        receiverId,
        bookingId: dto.bookingId,
        message: dto.message,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Update property inquiry count if first message from guest
    if (senderId !== property.ownerId) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { inquiriesCount: { increment: 1 } },
      }).catch(err => this.logger.warn(`Failed to update inquiriesCount: ${err.message}`));
    }

    // Emit event for email/push notification
    EventBus.emit('property_message:received', {
      messageId: message.id,
      propertyId,
      senderId,
      receiverId,
      content: dto.message,
    }, 'PropertyMessagesService');

    return message;
  }

  // F-P08: Get Conversation Thread for Property / Booking
  async getThread(propertyId: string, currentUserId: string, otherUserId?: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const isOwner = property.ownerId === currentUserId;
    const partnerId = isOwner ? otherUserId : property.ownerId;

    const where: any = {
      propertyId,
    };

    if (partnerId) {
      where.OR = [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId },
      ];
    } else {
      where.OR = [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ];
    }

    const messages = await this.prisma.propertyMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await this.prisma.propertyMessage.updateMany({
      where: {
        propertyId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return messages;
  }

  // F-P08: Get User's Active Property Conversations
  async getUserConversations(userId: string) {
    const messages = await this.prisma.propertyMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        property: { select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } } },
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by property and conversation partner
    const threadMap = new Map<string, any>();
    for (const msg of messages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      const key = `${msg.propertyId}_${partner.id}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          property: msg.property,
          partner,
          latestMessage: msg.message,
          latestMessageAt: msg.createdAt,
          isRead: msg.senderId === userId ? true : msg.isRead,
        });
      }
    }

    return Array.from(threadMap.values());
  }
}
