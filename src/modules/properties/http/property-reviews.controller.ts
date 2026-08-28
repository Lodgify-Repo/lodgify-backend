import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PropertyReviewsService } from '../services/property-reviews.service';
import { CreatePropertyReviewDto, OwnerReviewResponseDto } from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties - Reviews')
@Controller('properties')
export class PropertyReviewsController {
  constructor(private readonly reviewsService: PropertyReviewsService) {}

  @Get(':propertyId/reviews')
  @ApiOperation({ summary: 'F-P10: Get property reviews with 6-category rating breakdown (cleanliness, accuracy, etc.)' })
  async getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TRAVELER, Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Post(':propertyId/reviews')
  @ApiOperation({ summary: 'F-P10: Submit property review across 6 dimensions after stay' })
  async createReview(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreatePropertyReviewDto,
  ) {
    return this.reviewsService.createReview(propertyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Patch('reviews/:reviewId/response')
  @ApiOperation({ summary: 'F-P10: Owner responds to a guest review' })
  async respondToReview(
    @Request() req: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: OwnerReviewResponseDto,
  ) {
    return this.reviewsService.respondToReview(reviewId, req.user.id, dto);
  }
}
