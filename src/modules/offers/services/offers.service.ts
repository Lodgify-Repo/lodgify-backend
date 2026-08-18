import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateOfferDto, UpdateOfferStatusDto } from '../dto/offers.dto';
import { DomainError } from '@/common/domain/error';
import { OfferErrorCodes } from '../errors';
import { EventBus } from '@/common/events/event-bus';

@Injectable()
export class OffersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(userId: string, createOfferDto: CreateOfferDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const offer = await this.prisma.purchaseOffer.create({
      data: {
        userId,
        buyerName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
        buyerEmail: user?.email || 'guest@lodgify.com',
        buyerPhone: user?.phone || '000000000',
        propertyId: createOfferDto.propertyId,
        offerAmount: createOfferDto.amount,
        conditions: createOfferDto.message,
      },
    });

    // Notify agent
    // EventBus.getInstance().emit('offer:created', { agentId: offer.property.agentId, offerId: offer.id }, 'OffersService');

    return offer;
  }

  async getMyOffers(userId: string) {
    return await this.prisma.purchaseOffer.findMany({
      where: { userId },
      include: { property: { select: { title: true } } },
    });
  }

  async getAgentOffers(agentId: string) {
    return await this.prisma.purchaseOffer.findMany({
      where: { property: { authorizations: { some: { agentId } } } },
      include: { 
        property: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, updateDto: UpdateOfferStatusDto) {
    const offer = await this.prisma.purchaseOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new DomainError(OfferErrorCodes.OFFER_NOT_FOUND);
    }

    return await this.prisma.purchaseOffer.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }
}
