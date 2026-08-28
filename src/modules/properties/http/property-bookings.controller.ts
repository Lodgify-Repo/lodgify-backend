import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PropertyBookingsService } from '../services/property-bookings.service';
import {
  CalculatePropertyQuoteDto,
  CreatePropertyBookingDto,
  ReviewBookingRequestDto,
} from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties - Bookings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertyBookingsController {
  constructor(private readonly bookingsService: PropertyBookingsService) {}

  @Post(':propertyId/bookings/quote')
  @ApiOperation({ summary: 'F-P06: Calculate rental price quote with dynamic seasonal/weekend breakdown, cleaning fee, deposit' })
  async calculateQuote(
    @Param('propertyId') propertyId: string,
    @Body() dto: CalculatePropertyQuoteDto,
  ) {
    return this.bookingsService.calculateQuote(propertyId, dto);
  }

  @Roles(Role.TRAVELER, Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Post(':propertyId/bookings')
  @ApiOperation({ summary: 'F-P06: Submit rental booking request or instant book with rental agreement generation' })
  async createBooking(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreatePropertyBookingDto,
  ) {
    return this.bookingsService.createBooking(propertyId, req.user.id, dto);
  }

  @Roles(Role.TRAVELER, Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('bookings/my-trips')
  @ApiOperation({ summary: 'F-P06: Get guest rental bookings history' })
  async getGuestBookings(@Request() req: any) {
    return this.bookingsService.getGuestBookings(req.user.id);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('owner/incoming-bookings')
  @ApiOperation({ summary: 'F-P07: Get incoming booking requests for owner properties' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'PAID', 'CANCELLED'] })
  async getOwnerBookings(@Request() req: any, @Query('status') status?: string) {
    return this.bookingsService.getOwnerBookings(req.user.id, status);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch('bookings/:bookingId/review')
  @ApiOperation({ summary: 'F-P07: Accept or decline incoming booking request (24h timeout enforcement)' })
  async reviewBookingRequest(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: ReviewBookingRequestDto,
  ) {
    return this.bookingsService.reviewBookingRequest(bookingId, req.user.id, dto);
  }
}
