import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  CreatePurchaseOfferExtendedDto,
  CounterOfferDto,
  ReviewOfferDto,
  UpdateSalesPipelineStatusDto,
  PayEarnestDepositDto,
  RefundEarnestDepositDto,
  CreatePropertySaleDocumentDto,
  CreateBuyerSavedSearchDto,
  UpdateTransactionMilestoneDto,
} from '../dto/offers-extended.dto';
import { DomainError } from '@/common/domain/error';
import { OfferErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class OffersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // =========================================================
  // F-PS02: Formal Purchase Offer Submission
  // =========================================================
  async create(userId: string, createOfferDto: CreatePurchaseOfferExtendedDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError(OfferErrorCodes.OFFER_USER_NOT_FOUND, `User ${userId} not found`);
    }

    const property = await this.prisma.property.findUnique({
      where: { id: createOfferDto.propertyId },
      include: { owner: true },
    });
    if (!property) {
      throw new DomainError(OfferErrorCodes.OFFER_PROPERTY_NOT_FOUND, `Property ${createOfferDto.propertyId} not found`);
    }

    // Check duplicate pending offer
    const existingOffer = await this.prisma.purchaseOffer.findFirst({
      where: {
        userId,
        propertyId: createOfferDto.propertyId,
        status: { in: ['SUBMITTED', 'COUNTERED'] },
      },
      select: { id: true },
    });
    if (existingOffer) {
      throw new DomainError(
        OfferErrorCodes.OFFER_DUPLICATE_PENDING,
        'You already have an active offer under review on this property',
        { existingOfferId: existingOffer.id },
      );
    }

    const offer = await this.prisma.purchaseOffer.create({
      data: {
        userId,
        propertyId: createOfferDto.propertyId,
        buyerName: `${user.firstName} ${user.lastName}`,
        buyerEmail: user.email,
        buyerPhone: user.phone || '',
        offerAmount: createOfferDto.amount,
        financingMethod: createOfferDto.financingMethod || 'CASH',
        proposedClosingDate: createOfferDto.proposedClosingDate ? new Date(createOfferDto.proposedClosingDate) : undefined,
        contingencies: createOfferDto.contingencies || [],
        earnestDepositAmount: createOfferDto.earnestDepositAmount || 0,
        preApprovalLetterUrl: createOfferDto.preApprovalLetterUrl,
        conditions: createOfferDto.message,
        expiresAt: createOfferDto.expiresAt ? new Date(createOfferDto.expiresAt) : undefined,
        status: 'SUBMITTED',
        negotiationHistory: [
          {
            round: 1,
            by: 'BUYER',
            amount: createOfferDto.amount,
            conditions: createOfferDto.message,
            timestamp: new Date().toISOString(),
          },
        ] as any,
      },
      include: {
        property: { select: { title: true, price: true, city: true } },
      },
    });

    // Advance sales pipeline status to OFFER_RECEIVED if currently LISTED
    if (property.salesPipelineStatus === 'LISTED') {
      await this.prisma.property.update({
        where: { id: property.id },
        data: { salesPipelineStatus: 'OFFER_RECEIVED' },
      }).catch(err => this.logger.warn(`Failed to advance pipeline status: ${err.message}`));
    }

    EventBus.emit('offer:received', { offerId: offer.id, propertyId: offer.propertyId }, 'OffersService');

    return offer;
  }

  // =========================================================
  // F-PS03: Offer Management & Negotiation
  // =========================================================
  async getOffersForProperty(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Unauthorized');

    const offers = await this.prisma.purchaseOffer.findMany({
      where: { propertyId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return offers.map(offer => {
      const askingPrice = property.askingPrice || property.price || 0;
      const difference = offer.offerAmount - askingPrice;
      const percentDifference = askingPrice > 0 ? parseFloat(((difference / askingPrice) * 100).toFixed(2)) : 0;

      return {
        ...offer,
        askingPrice,
        priceComparison: {
          difference,
          percentDifference,
          isAboveAsking: difference >= 0,
        },
      };
    });
  }

  async reviewOffer(offerId: string, ownerId: string, dto: ReviewOfferDto) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: offerId },
      include: { property: true, user: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.property.ownerId !== ownerId) throw new ForbiddenException('Unauthorized');

    const history = Array.isArray(offer.negotiationHistory) ? (offer.negotiationHistory as any[]) : [];

    if (dto.decision === 'ACCEPT') {
      const updated = await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'ACCEPTED',
          negotiationHistory: [
            ...history,
            { round: history.length + 1, by: 'SELLER', action: 'ACCEPTED', timestamp: new Date().toISOString() },
          ] as any,
        },
      });

      // Advance property sales pipeline to OFFER_ACCEPTED
      await this.prisma.property.update({
        where: { id: offer.propertyId },
        data: { salesPipelineStatus: 'OFFER_ACCEPTED' },
      });

      // Auto-initialize the 7 standard milestones (F-PS10)
      await this.initializeMilestones(offer.propertyId, offer.id);

      EventBus.emit('offer:responded', { offerId: updated.id, status: 'ACCEPTED' }, 'OffersService');
      return updated;
    }

    if (dto.decision === 'REJECT') {
      const updated = await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'REJECTED',
          conditions: dto.rejectionReason || offer.conditions,
          negotiationHistory: [
            ...history,
            { round: history.length + 1, by: 'SELLER', action: 'REJECTED', reason: dto.rejectionReason, timestamp: new Date().toISOString() },
          ] as any,
        },
      });

      EventBus.emit('offer:responded', { offerId: updated.id, status: 'REJECTED' }, 'OffersService');
      return updated;
    }

    if (dto.decision === 'COUNTER') {
      if (!dto.counterAmount) throw new BadRequestException('Counter amount is required for counter-offers');

      const updated = await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'COUNTERED',
          counterAmount: dto.counterAmount,
          counterConditions: dto.counterConditions,
          counteredBy: 'SELLER',
          negotiationHistory: [
            ...history,
            {
              round: history.length + 1,
              by: 'SELLER',
              action: 'COUNTERED',
              amount: dto.counterAmount,
              conditions: dto.counterConditions,
              timestamp: new Date().toISOString(),
            },
          ] as any,
        },
      });

      // Update property pipeline to NEGOTIATING
      await this.prisma.property.update({
        where: { id: offer.propertyId },
        data: { salesPipelineStatus: 'NEGOTIATING' },
      });

      EventBus.emit('offer:responded', { offerId: updated.id, status: 'COUNTERED' }, 'OffersService');
      return updated;
    }

    throw new BadRequestException('Invalid decision');
  }

  // Buyer accepts or counters seller counter-offer
  async buyerRespondToCounter(offerId: string, userId: string, dto: { decision: 'ACCEPT' | 'REJECT' | 'COUNTER'; counterAmount?: number; counterConditions?: string }) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: offerId },
      include: { property: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException('Unauthorized');

    const history = Array.isArray(offer.negotiationHistory) ? (offer.negotiationHistory as any[]) : [];

    if (dto.decision === 'ACCEPT') {
      const updated = await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'ACCEPTED',
          offerAmount: offer.counterAmount || offer.offerAmount,
          negotiationHistory: [
            ...history,
            { round: history.length + 1, by: 'BUYER', action: 'ACCEPTED_COUNTER', timestamp: new Date().toISOString() },
          ] as any,
        },
      });

      await this.prisma.property.update({
        where: { id: offer.propertyId },
        data: { salesPipelineStatus: 'OFFER_ACCEPTED' },
      });

      await this.initializeMilestones(offer.propertyId, offer.id);
      EventBus.emit('offer:responded', { offerId: updated.id, status: 'ACCEPTED' }, 'OffersService');
      return updated;
    }

    if (dto.decision === 'REJECT') {
      return await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'WITHDRAWN',
          negotiationHistory: [
            ...history,
            { round: history.length + 1, by: 'BUYER', action: 'REJECTED_COUNTER', timestamp: new Date().toISOString() },
          ] as any,
        },
      });
    }

    if (dto.decision === 'COUNTER') {
      if (!dto.counterAmount) throw new BadRequestException('Counter amount required');

      return await this.prisma.purchaseOffer.update({
        where: { id: offerId },
        data: {
          status: 'COUNTERED',
          offerAmount: dto.counterAmount,
          conditions: dto.counterConditions,
          counteredBy: 'BUYER',
          negotiationHistory: [
            ...history,
            {
              round: history.length + 1,
              by: 'BUYER',
              action: 'COUNTERED',
              amount: dto.counterAmount,
              conditions: dto.counterConditions,
              timestamp: new Date().toISOString(),
            },
          ] as any,
        },
      });
    }
  }

  // =========================================================
  // F-PS04: Sales Pipeline Tracking
  // =========================================================
  async updateSalesPipelineStatus(propertyId: string, ownerId: string, dto: UpdateSalesPipelineStatusDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Unauthorized');

    const updated = await this.prisma.property.update({
      where: { id: propertyId },
      data: { salesPipelineStatus: dto.status },
    });

    EventBus.emit('property:updated', { propertyId }, 'OffersService');
    return updated;
  }

  // =========================================================
  // F-PS05: Earnest Deposit Handling (Escrow)
  // =========================================================
  async payEarnestDeposit(offerId: string, userId: string, dto: PayEarnestDepositDto) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: offerId },
      include: { property: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenException('Unauthorized');

    return await this.prisma.purchaseOffer.update({
      where: { id: offerId },
      data: {
        earnestDepositAmount: dto.amount,
        earnestDepositStatus: 'HELD_IN_ESCROW',
        earnestDepositReference: dto.paymentReference,
        earnestDepositPaidAt: new Date(),
      },
      include: { property: { select: { title: true } } },
    });
  }

  async refundEarnestDeposit(offerId: string, ownerId: string, dto: RefundEarnestDepositDto) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: offerId },
      include: { property: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.property.ownerId !== ownerId) throw new ForbiddenException('Unauthorized');

    return await this.prisma.purchaseOffer.update({
      where: { id: offerId },
      data: {
        earnestDepositStatus: 'REFUNDED',
        conditions: `Earnest deposit refunded: ${dto.reason}`,
      },
    });
  }

  // =========================================================
  // F-PS07: Secure Legal Document Management
  // =========================================================
  async uploadSaleDocument(userId: string, dto: CreatePropertySaleDocumentDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenException('Only property owner can upload title documents');

    return await this.prisma.propertySaleDocument.create({
      data: {
        propertyId: dto.propertyId,
        title: dto.title,
        docType: dto.docType,
        fileUrl: dto.fileUrl,
        isConfidential: dto.isConfidential !== undefined ? dto.isConfidential : true,
        accessLevel: dto.accessLevel || 'RESTRICTED',
        uploadedBy: userId,
      },
    });
  }

  async getPropertyDocuments(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        authorizations: { where: { agent: { userId }, status: 'APPROVED' } },
        offers: { where: { userId, status: { in: ['SUBMITTED', 'ACCEPTED', 'COUNTERED'] } } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');

    const isOwner = property.ownerId === userId;
    const isAuthorizedAgent = property.authorizations.length > 0;
    const isVerifiedBuyer = property.offers.length > 0;

    if (!isOwner && !isAuthorizedAgent && !isVerifiedBuyer) {
      // Return only public non-confidential documents
      return await this.prisma.propertySaleDocument.findMany({
        where: { propertyId, isConfidential: false },
      });
    }

    // Verified parties get full document access
    return await this.prisma.propertySaleDocument.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // =========================================================
  // F-PS09: Buyer Saved Searches
  // =========================================================
  async createSavedSearch(userId: string, dto: CreateBuyerSavedSearchDto) {
    return await this.prisma.buyerSavedSearch.create({
      data: {
        userId,
        name: dto.name,
        criteria: dto.criteria as any,
        emailAlerts: dto.emailAlerts !== undefined ? dto.emailAlerts : true,
        alertFrequency: dto.alertFrequency || 'INSTANT',
      },
    });
  }

  async getMySavedSearches(userId: string) {
    return await this.prisma.buyerSavedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSavedSearch(id: string, userId: string) {
    const search = await this.prisma.buyerSavedSearch.findUnique({ where: { id } });
    if (!search) throw new NotFoundException('Saved search not found');
    if (search.userId !== userId) throw new ForbiddenException('Unauthorized');

    return await this.prisma.buyerSavedSearch.delete({ where: { id } });
  }

  // =========================================================
  // F-PS10: Sales Transaction Milestones
  // =========================================================
  private async initializeMilestones(propertyId: string, offerId: string) {
    const existing = await this.prisma.saleTransactionMilestone.findFirst({ where: { offerId } });
    if (existing) return;

    const standardMilestones = [
      { type: 'OFFER_ACCEPTED', name: 'Offer Accepted & Agreement Signed', desc: 'Buyer and Seller have signed the binding purchase agreement.', sort: 1, status: 'COMPLETED' },
      { type: 'INSPECTION_COMPLETE', name: 'Physical Property Inspection', desc: 'Structural and environmental assessment complete.', sort: 2, status: 'PENDING' },
      { type: 'FINANCING_SECURED', name: 'Financing / Mortgage Secured', desc: 'Proof of funds verified or bank mortgage approval letter issued.', sort: 3, status: 'PENDING' },
      { type: 'TITLE_VERIFIED', name: 'Title Search & Legal Verification', desc: 'Verification of C of O / Governor Consent at Lands Bureau.', sort: 4, status: 'PENDING' },
      { type: 'CLOSING_DATE_SET', name: 'Closing Date & Terms Scheduled', desc: 'Final execution and settlement date scheduled with solicitors.', sort: 5, status: 'PENDING' },
      { type: 'FUNDS_TRANSFERRED', name: 'Full Purchase Consideration Paid', desc: 'Closing consideration transferred to seller / solicitor.', sort: 6, status: 'PENDING' },
      { type: 'KEYS_HANDED_OVER', name: 'Keys & Possession Handed Over', desc: 'Deed of assignment executed and keys transferred to buyer.', sort: 7, status: 'PENDING' },
    ];

    for (const m of standardMilestones) {
      await this.prisma.saleTransactionMilestone.create({
        data: {
          propertyId,
          offerId,
          milestoneType: m.type,
          name: m.name,
          description: m.desc,
          sortOrder: m.sort,
          status: m.status as any,
          completedAt: m.status === 'COMPLETED' ? new Date() : null,
        },
      });
    }
  }

  async getOfferMilestones(offerId: string, userId: string) {
    const offer = await this.prisma.purchaseOffer.findUnique({
      where: { id: offerId },
      include: { property: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const milestones = await this.prisma.saleTransactionMilestone.findMany({
      where: { offerId },
      orderBy: { sortOrder: 'asc' },
    });

    const completedCount = milestones.filter(m => m.status === 'COMPLETED').length;
    const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

    return {
      offerId,
      propertyTitle: offer.property.title,
      overallProgress: `${progressPercent}%`,
      completedMilestones: completedCount,
      totalMilestones: milestones.length,
      milestones,
    };
  }

  async updateMilestone(milestoneId: string, userId: string, dto: UpdateTransactionMilestoneDto) {
    const milestone = await this.prisma.saleTransactionMilestone.findUnique({
      where: { id: milestoneId },
      include: { property: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const completedAt = dto.status === 'COMPLETED' ? new Date() : undefined;

    const updated = await this.prisma.saleTransactionMilestone.update({
      where: { id: milestoneId },
      data: {
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        attachmentUrls: dto.attachmentUrls,
        notes: dto.notes,
        completedAt,
      },
    });

    // If final milestone is completed, set property sales pipeline to SOLD
    if (milestone.milestoneType === 'KEYS_HANDED_OVER' && dto.status === 'COMPLETED') {
      await this.prisma.property.update({
        where: { id: milestone.propertyId },
        data: {
          salesPipelineStatus: 'SOLD',
          status: 'SOLD',
        },
      }).catch(err => this.logger.warn(`Failed to set property status to SOLD: ${err.message}`));
    }

    return updated;
  }

  // =========================================================
  // Legacy / Basic Getters
  // =========================================================
  async getMyOffers(userId: string) {
    return await this.prisma.purchaseOffer.findMany({
      where: { userId },
      include: { property: { select: { title: true, price: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAgentOffers(agentId: string) {
    return await this.prisma.purchaseOffer.findMany({
      where: { property: { authorizations: { some: { agentId } } } },
      include: {
        property: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateDto: { status: string }) {
    const offer = await this.prisma.purchaseOffer.findUnique({ where: { id } });
    if (!offer) throw new DomainError(OfferErrorCodes.OFFER_NOT_FOUND);

    const updated = await this.prisma.purchaseOffer.update({
      where: { id },
      data: { status: updateDto.status },
    });

    EventBus.emit('offer:responded', { offerId: updated.id, status: updated.status }, 'OffersService');
    return updated;
  }
}
