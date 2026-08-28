import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreatePropertyReviewDto, OwnerReviewResponseDto } from '../dto/properties-extended.dto';

@Injectable()
export class PropertyReviewsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P10: Submit Guest Review (6-category rating)
  async createReview(propertyId: string, userId: string, dto: CreatePropertyReviewDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.deletedAt) throw new NotFoundException('Property not found');

    // Optional booking validation: ensure user had a completed/accepted booking if bookingId provided
    if (dto.bookingId) {
      const booking = await this.prisma.propertyBooking.findUnique({
        where: { id: dto.bookingId },
      });
      if (!booking || booking.guestId !== userId || booking.propertyId !== propertyId) {
        throw new BadRequestException('Invalid booking for this review');
      }
    }

    // Calculate overall average rating from 6 dimensions
    const overallRating = parseFloat(
      (
        (dto.cleanliness + dto.accuracy + dto.checkIn + dto.communication + dto.location + dto.value) /
        6
      ).toFixed(2)
    );

    const review = await this.prisma.propertyReview.create({
      data: {
        propertyId,
        userId,
        bookingId: dto.bookingId,
        cleanliness: dto.cleanliness,
        accuracy: dto.accuracy,
        checkIn: dto.checkIn,
        communication: dto.communication,
        location: dto.location,
        value: dto.value,
        overallRating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Recompute property average rating & review count
    const allReviews = await this.prisma.propertyReview.findMany({
      where: { propertyId },
      select: { overallRating: true },
    });

    const reviewCount = allReviews.length;
    const avgRating = parseFloat(
      (allReviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount).toFixed(2)
    );

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        rating: avgRating,
        reviewCount,
      },
    });

    return review;
  }

  // F-P10: Owner responds to a review
  async respondToReview(reviewId: string, ownerId: string, dto: OwnerReviewResponseDto) {
    const review = await this.prisma.propertyReview.findUnique({
      where: { id: reviewId },
      include: { property: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.propertyReview.update({
      where: { id: reviewId },
      data: {
        ownerResponse: dto.response,
        ownerRespondedAt: new Date(),
      },
    });
  }

  // F-P10: Get Reviews for a Property with Category Summary
  async getPropertyReviews(propertyId: string) {
    const reviews = await this.prisma.propertyReview.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 5.0,
        categoryAverages: {
          cleanliness: 5.0,
          accuracy: 5.0,
          checkIn: 5.0,
          communication: 5.0,
          location: 5.0,
          value: 5.0,
        },
        reviews: [],
      };
    }

    const count = reviews.length;
    const sum = reviews.reduce(
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

    return {
      totalReviews: count,
      averageRating: parseFloat((sum.overall / count).toFixed(2)),
      categoryAverages: {
        cleanliness: parseFloat((sum.cleanliness / count).toFixed(1)),
        accuracy: parseFloat((sum.accuracy / count).toFixed(1)),
        checkIn: parseFloat((sum.checkIn / count).toFixed(1)),
        communication: parseFloat((sum.communication / count).toFixed(1)),
        location: parseFloat((sum.location / count).toFixed(1)),
        value: parseFloat((sum.value / count).toFixed(1)),
      },
      reviews,
    };
  }
}
