import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateOfferDto, UpdateOfferStatusDto } from '../dto/offers.dto';
import { DomainError } from '@/common/domain/error';
import { OfferErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class OffersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(userId: string, createOfferDto: CreateOfferDto) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(
        OfferErrorCodes.OFFER_USER_NOT_FOUND,
        `User ${userId} not found`,
      );
    }

    // Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: createOfferDto.propertyId },
      select: { id: true },
    });
    if (!property) {
      throw new DomainError(
        OfferErrorCodes.OFFER_PROPERTY_NOT_FOUND,
        `Property ${createOfferDto.propertyId} not found`,
      );
    }

    // Check for existing PENDING offer from same user on same property
    const existingOffer = await this.prisma.purchaseOffer.findFirst({
      where: {
        userId,
        propertyId: createOfferDto.propertyId,
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (existingOffer) {
      throw new DomainError(
        OfferErrorCodes.OFFER_DUPLICATE_PENDING,
        'You already have a pending offer on this property',
        { existingOfferId: existingOffer.id },
      );
    }

    const offer = await this.prisma.purchaseOffer.create({
      data: {
        userId,
        buyerName: `${user.firstName} ${user.lastName}`,
        buyerEmail: user.email,
        buyerPhone: user.phone || '',
        propertyId: createOfferDto.propertyId,
        offerAmount: createOfferDto.amount,
        conditions: createOfferDto.message,
      },
    });

    EventBus.emit('offer:received', { offerId: offer.id, propertyId: offer.propertyId }, 'OffersService');

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

    const updated = await this.prisma.purchaseOffer.update({
      where: { id },
      data: { status: updateDto.status },
    });

    EventBus.emit('offer:responded', { offerId: updated.id, status: updated.status }, 'OffersService');

    return updated;
  }
}
