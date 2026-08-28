import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { PropertyPricingService } from './property-pricing.service';
import {
  CalculatePropertyQuoteDto,
  CreatePropertyBookingDto,
  ReviewBookingRequestDto,
} from '../dto/properties-extended.dto';
import EventBus from '@/common/events/event-bus';

@Injectable()
export class PropertyBookingsService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PropertyPricingService,
  ) {
    super();
  }

  // F-P06: Calculate Detailed Booking Price Quote
  async calculateQuote(propertyId: string, dto: CalculatePropertyQuoteDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || property.deletedAt) throw new NotFoundException('Property not found');

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    // Validate min stay duration
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < property.minStayNights) {
      throw new BadRequestException(`Minimum stay for this property is ${property.minStayNights} night(s)`);
    }

    if (dto.guestsCount > property.maxGuests) {
      throw new BadRequestException(`Maximum guests allowed is ${property.maxGuests}`);
    }

    // Check calendar availability
    const conflict = await this.prisma.propertyBooking.findFirst({
      where: {
        propertyId,
        status: { in: ['ACCEPTED', 'PAID', 'CHECKED_IN'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });

    const blockConflict = await this.prisma.propertyBlockedDate.findFirst({
      where: {
        propertyId,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
    });

    if (conflict || blockConflict) {
      throw new BadRequestException('Selected dates are not available for booking');
    }

    // Calculate base amount taking into account seasonal & weekend rules
    const pricingBreakdown = await this.pricingService.calculateNightlyBreakdown(propertyId, checkIn, checkOut);

    // Additional guest fees
    const extraGuests = Math.max(0, dto.guestsCount - property.baseGuests);
    const extraGuestsFee = extraGuests * (property.additionalGuestFee || 0) * nights;

    const cleaningFee = property.cleaningFee || 0;
    const securityDeposit = property.securityDeposit || 0;
    const totalAmount = pricingBreakdown.totalBaseAmount + cleaningFee + securityDeposit + extraGuestsFee;

    return {
      propertyId,
      nights,
      guestsCount: dto.guestsCount,
      baseNightlyRate: pricingBreakdown.baseNightlyRate,
      averageNightlyRate: pricingBreakdown.averageNightlyRate,
      baseAmount: pricingBreakdown.totalBaseAmount,
      cleaningFee,
      securityDeposit,
      extraGuestsFee,
      totalAmount,
      currency: property.currency,
      instantBookable: property.instantBookable,
      cancellationPolicy: property.cancellationPolicy,
      dailyRates: pricingBreakdown.dailyRates,
    };
  }

  // F-P06: Submit Rental Booking
  async createBooking(propertyId: string, guestId: string, dto: CreatePropertyBookingDto) {
    const quote = await this.calculateQuote(propertyId, dto);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const isInstant = property.instantBookable;

    // Standard Rental Agreement Text
    const rentalAgreementText = `
RENTAL AGREEMENT & TERMS
-------------------------
Property: ${property.title}
Address: ${property.address}, ${property.city}, ${property.state}
Host/Owner: ${property.owner.firstName} ${property.owner.lastName}
Guest ID: ${guestId}
Check-In: ${dto.checkInDate}
Check-Out: ${dto.checkOutDate} (${quote.nights} nights, ${dto.guestsCount} guests)
Total Rental Fee: ${quote.currency} ${quote.totalAmount} (Includes ${quote.currency} ${quote.securityDeposit} refundable deposit)

House Rules & Policies:
- Rules: ${property.houseRules.join(', ') || 'Standard residential conduct'}
- Cancellation Policy: ${property.cancellationPolicy}
- Security deposit will be refunded within 48 hours post-checkout pending inspection.
-------------------------`.trim();

    // 24-hour expiration for booking requests
    const expiresAt = isInstant ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const booking = await this.prisma.propertyBooking.create({
      data: {
        propertyId,
        guestId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights: quote.nights,
        guestsCount: dto.guestsCount,
        baseAmount: quote.baseAmount,
        cleaningFee: quote.cleaningFee,
        securityDeposit: quote.securityDeposit,
        extraGuestsFee: quote.extraGuestsFee,
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        status: isInstant ? 'ACCEPTED' : 'PENDING',
        paymentMethod: dto.paymentMethod || 'PAYSTACK',
        specialRequests: dto.specialRequests,
        rentalAgreementText,
        expiresAt,
      },
      include: {
        property: { select: { title: true, address: true, city: true } },
        guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // Update property bookings count
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { bookingsCount: { increment: 1 } },
    });

    // Emit event for notification
    EventBus.emit('property_booking:created', {
      bookingId: booking.id,
      propertyId,
      guestId,
      ownerId: property.ownerId,
      isInstant,
    }, 'PropertyBookingsService');

    return booking;
  }

  // F-P07: Owner Reviews Booking Request (Accept / Decline)
  async reviewBookingRequest(bookingId: string, ownerId: string, dto: ReviewBookingRequestDto) {
    const booking = await this.prisma.propertyBooking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');
    if (booking.status !== 'PENDING') {
      throw new BadRequestException(`Cannot modify booking with status ${booking.status}`);
    }

    if (booking.expiresAt && booking.expiresAt < new Date()) {
      await this.prisma.propertyBooking.update({
        where: { id: bookingId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This booking request has expired (24h timeout)');
    }

    const newStatus = dto.action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

    const updated = await this.prisma.propertyBooking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        declineReason: dto.action === 'DECLINE' ? dto.declineReason : undefined,
      },
      include: {
        property: { select: { title: true } },
        guest: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (newStatus === 'ACCEPTED') {
      EventBus.emit('property_booking:accepted', {
        bookingId: updated.id,
        guestId: updated.guestId,
        ownerId,
      }, 'PropertyBookingsService');
    } else {
      EventBus.emit('property_booking:declined', {
        bookingId: updated.id,
        guestId: updated.guestId,
        ownerId,
      }, 'PropertyBookingsService');
    }

    return updated;
  }

  // Guest bookings list
  async getGuestBookings(guestId: string) {
    return await this.prisma.propertyBooking.findMany({
      where: { guestId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Owner bookings list for their properties
  async getOwnerBookings(ownerId: string, status?: string) {
    const where: any = {
      property: { ownerId },
    };
    if (status) where.status = status;

    return await this.prisma.propertyBooking.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, city: true } },
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
