import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  CreatePropertyExtendedDto,
  UpdatePropertyExtendedDto,
  VerifyPropertyDto,
} from '../dto/properties-extended.dto';
import { DomainError } from '@/common/domain/error';
import { PropertyErrorCodes } from '../errors';

@Injectable()
export class PropertiesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P01: Create Property Listing
  async create(createPropertyDto: CreatePropertyExtendedDto, ownerId: string) {
    const { images, ...data } = createPropertyDto;

    // Default nightly/monthly rates if not provided
    const nightlyRate = data.nightlyRate ?? (data.listingType === 'SHORT_TERM_RENT' ? data.price : undefined);
    const monthlyRate = data.monthlyRate ?? (data.listingType === 'LONG_TERM_RENT' ? data.price : undefined);

    // Auto-check if owner already has verified profile
    const ownerProfile = await this.prisma.propertyOwnerProfile.findUnique({
      where: { userId: ownerId },
    });
    const isOwnerVerified = ownerProfile?.status === 'VERIFIED';

    return await this.prisma.property.create({
      data: {
        ...data,
        nightlyRate,
        monthlyRate,
        ownerId,
        isOwnerVerified,
        status: 'AVAILABLE',
        images: images && images.length > 0 ? {
          create: images.slice(0, 20).map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, createdAt: true } },
      },
    });
  }

  // F-P05: Rich Property Detail Page
  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            propertyOwnerProfile: { select: { status: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        pricingRules: {
          where: { isActive: true },
        },
      },
    });

    if (!property || property.deletedAt) {
      throw new DomainError(PropertyErrorCodes.PROPERTY_NOT_FOUND);
    }

    // Increment views count asynchronously
    this.prisma.property.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }).catch(err => this.logger.warn(`Failed to increment viewsCount for property ${id}: ${err.message}`));

    // Compute category rating averages
    const allReviews = await this.prisma.propertyReview.findMany({
      where: { propertyId: id },
      select: {
        cleanliness: true,
        accuracy: true,
        checkIn: true,
        communication: true,
        location: true,
        value: true,
        overallRating: true,
      },
    });

    const reviewCount = allReviews.length;
    let ratingBreakdown = {
      cleanliness: 5.0,
      accuracy: 5.0,
      checkIn: 5.0,
      communication: 5.0,
      location: 5.0,
      value: 5.0,
      overall: 5.0,
    };

    if (reviewCount > 0) {
      const sum = allReviews.reduce(
        (acc, r) => ({
          cleanliness: acc.cleanliness + r.cleanliness,
          accuracy: acc.accuracy + r.accuracy,
          checkIn: acc.checkIn + r.checkIn,
          communication: acc.communication + r.communication,
          location: acc.location + r.location,
          value: acc.value + r.value,
          overall: acc.overall + r.overallRating,
        }),
        { cleanliness: 0, accuracy: 0, checkIn: 0, communication: 0, location: 0, value: 0, overall: 0 }
      );

      ratingBreakdown = {
        cleanliness: parseFloat((sum.cleanliness / reviewCount).toFixed(1)),
        accuracy: parseFloat((sum.accuracy / reviewCount).toFixed(1)),
        checkIn: parseFloat((sum.checkIn / reviewCount).toFixed(1)),
        communication: parseFloat((sum.communication / reviewCount).toFixed(1)),
        location: parseFloat((sum.location / reviewCount).toFixed(1)),
        value: parseFloat((sum.value / reviewCount).toFixed(1)),
        overall: parseFloat((sum.overall / reviewCount).toFixed(1)),
      };
    }

    return {
      ...property,
      reviewCount,
      rating: ratingBreakdown.overall,
      ratingBreakdown,
    };
  }

  // F-P01 & F-P11: Update Property Details
  async update(id: string, updateDto: UpdatePropertyExtendedDto, ownerId?: string) {
    const existing = await this.prisma.property.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new DomainError(PropertyErrorCodes.PROPERTY_NOT_FOUND);
    }

    if (ownerId && existing.ownerId !== ownerId) {
      throw new BadRequestException('You do not have permission to update this property');
    }

    const { images, ...data } = updateDto;

    // Handle updating images if provided
    if (images && images.length > 0) {
      await this.prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      await this.prisma.propertyImage.createMany({
        data: images.slice(0, 20).map((url, idx) => ({
          propertyId: id,
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    return await this.prisma.property.update({
      where: { id },
      data,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  // F-P11: Owner Listing Management Dashboard
  async getOwnerProperties(ownerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: {
          select: {
            bookings: true,
            inquiries: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      listingType: p.listingType,
      price: p.price,
      nightlyRate: p.nightlyRate,
      status: p.status,
      city: p.city,
      state: p.state,
      primaryImage: p.images[0]?.url || null,
      viewsCount: p.viewsCount,
      inquiriesCount: p._count.inquiries,
      bookingsCount: p._count.bookings,
      rating: p.rating,
      reviewCount: p._count.reviews,
      isOwnerVerified: p.isOwnerVerified,
      isOwnershipVerified: p.isOwnershipVerified,
      isPhotoVerified: p.isPhotoVerified,
      verificationStatus: p.verificationStatus,
      createdAt: p.createdAt,
    }));
  }

  // F-P11: Pause / Resume Property Listing
  async setListingStatus(id: string, status: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.property.update({
      where: { id },
      data: { status },
      select: { id: true, title: true, status: true },
    });
  }

  // F-P11: Delete / Soft-Delete Listing
  async remove(id: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'OFFLINE' },
    });
  }

  // F-P09: Property Verification Management (Admin)
  async verifyProperty(id: string, dto: VerifyPropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    return await this.prisma.property.update({
      where: { id },
      data: {
        isOwnerVerified: dto.isOwnerVerified,
        isOwnershipVerified: dto.isOwnershipVerified,
        isPhotoVerified: dto.isPhotoVerified,
        verificationStatus: dto.verificationStatus,
        verificationNotes: dto.verificationNotes,
      },
    });
  }

  // Legacy owner profile verification support
  async submitOwnerVerification(userId: string, dto: any) {
    return await this.prisma.propertyOwnerProfile.upsert({
      where: { userId },
      update: {
        deedUrl: dto.deedUrl,
        utilityBillUrl: dto.utilityBillUrl,
        idUrl: dto.idUrl,
        status: 'PENDING',
      },
      create: {
        userId,
        deedUrl: dto.deedUrl,
        utilityBillUrl: dto.utilityBillUrl,
        idUrl: dto.idUrl,
        status: 'PENDING',
      },
    });
  }

  async verifyOwner(profileId: string, status: string) {
    const profile = await this.prisma.propertyOwnerProfile.update({
      where: { id: profileId },
      data: { status },
    });

    if (status === 'VERIFIED') {
      await this.prisma.property.updateMany({
        where: { ownerId: profile.userId },
        data: { isOwnerVerified: true },
      });
    }

    return profile;
  }
}
