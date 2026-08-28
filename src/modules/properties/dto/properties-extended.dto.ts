import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===============================================
// F-P01: Property Listing Creation & Update
// ===============================================
export class CreatePropertyExtendedDto {
  @ApiProperty({ description: 'Property title', example: 'Luxury 4-Bedroom Beachfront Villa' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed property description' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Property type',
    enum: ['APARTMENT', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL', 'LAND'],
    example: 'VILLA',
  })
  @IsIn(['APARTMENT', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL', 'LAND'])
  type: string;

  @ApiProperty({
    description: 'Listing type',
    enum: ['SHORT_TERM_RENT', 'LONG_TERM_RENT', 'SALE'],
    example: 'SHORT_TERM_RENT',
  })
  @IsIn(['SHORT_TERM_RENT', 'LONG_TERM_RENT', 'SALE'])
  listingType: string;

  @ApiProperty({ description: 'Base price or sale price in NGN', example: 120000 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Physical street address', example: '25 Ocean Drive, Victoria Island' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State', example: 'Lagos' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country', example: 'Nigeria' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 6.4281 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 3.4219 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Number of bedrooms', example: 4 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms', example: 4 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Total area in square feet', example: 3500 })
  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @ApiPropertyOptional({ description: 'Custom feature highlights', example: ['Ocean View', 'Private Pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  // F-P01 & F-P05: Media, Details & Rules
  @ApiPropertyOptional({ description: 'Up to 20 photo URLs' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Video tour URL (YouTube/Vimeo/MP4)', example: 'https://youtube.com/watch?v=xyz' })
  @IsOptional()
  @IsString()
  videoTourUrl?: string;

  @ApiPropertyOptional({ description: 'Floor plan diagram URL' })
  @IsOptional()
  @IsString()
  floorPlanUrl?: string;

  @ApiPropertyOptional({
    description: 'Standard amenities',
    example: ['WIFI', 'POOL', 'AIR_CONDITIONING', 'KITCHEN', 'PARKING', 'GENERATOR'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'House rules',
    example: ['NO_SMOKING', 'NO_PARTIES', 'CHECKIN_AFTER_2PM', 'PETS_ALLOWED'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    enum: ['FLEXIBLE', 'MODERATE', 'STRICT'],
    default: 'FLEXIBLE',
  })
  @IsOptional()
  @IsIn(['FLEXIBLE', 'MODERATE', 'STRICT'])
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Pet-friendly flag', default: false })
  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @ApiPropertyOptional({ description: 'Furnished flag', default: false })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({ description: 'Maximum guests accommodated', example: 8, default: 1 })
  @IsOptional()
  @IsNumber()
  maxGuests?: number;

  // F-PS01: Sale Listing Configuration
  @ApiPropertyOptional({ description: 'Asking price for sale listing', example: 120000000 })
  @IsOptional()
  @IsNumber()
  askingPrice?: number;

  @ApiPropertyOptional({ description: 'Whether the asking price is negotiable', default: false })
  @IsOptional()
  @IsBoolean()
  isPriceNegotiable?: boolean;

  @ApiPropertyOptional({ description: 'Year the property was constructed', example: 2023 })
  @IsOptional()
  @IsNumber()
  yearBuilt?: number;

  @ApiPropertyOptional({
    description: 'Title or deed type',
    enum: ['C_OF_O', 'GOVERNORS_CONSENT', 'GAZETTE', 'DEED_OF_ASSIGNMENT', 'EXCISION', 'SURVEY_PLAN'],
    example: 'C_OF_O',
  })
  @IsOptional()
  @IsString()
  titleType?: string;

  @ApiPropertyOptional({ description: 'Detailed neighborhood and location description' })
  @IsOptional()
  @IsString()
  neighborhoodDescription?: string;

  @ApiPropertyOptional({
    description: 'Nearby amenities and landmarks',
    example: ['Lekki Toll Gate', 'Green Springs School', 'Ebeano Supermarket', 'Chevron HQ'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nearbyAmenities?: string[];

  // F-P02: Pricing Details
  @ApiPropertyOptional({ description: 'Nightly rate for short-term rental', example: 120000 })
  @IsOptional()
  @IsNumber()
  nightlyRate?: number;

  @ApiPropertyOptional({ description: 'Monthly rate for long-term rental', example: 2500000 })
  @IsOptional()
  @IsNumber()
  monthlyRate?: number;

  @ApiPropertyOptional({ description: 'Refundable security deposit amount', example: 50000, default: 0 })
  @IsOptional()
  @IsNumber()
  securityDeposit?: number;

  @ApiPropertyOptional({ description: 'Cleaning fee per stay', example: 15000, default: 0 })
  @IsOptional()
  @IsNumber()
  cleaningFee?: number;

  @ApiPropertyOptional({ description: 'Fee per additional guest beyond baseGuests', example: 5000, default: 0 })
  @IsOptional()
  @IsNumber()
  additionalGuestFee?: number;

  @ApiPropertyOptional({ description: 'Base guests included before extra fee kicks in', default: 2 })
  @IsOptional()
  @IsNumber()
  baseGuests?: number;

  @ApiPropertyOptional({ description: 'Minimum stay duration in nights', default: 1 })
  @IsOptional()
  @IsNumber()
  minStayNights?: number;

  @ApiPropertyOptional({ description: 'Allow instant booking without manual host approval', default: false })
  @IsOptional()
  @IsBoolean()
  instantBookable?: boolean;
}

export class UpdatePropertyExtendedDto extends CreatePropertyExtendedDto {
  @ApiPropertyOptional({
    description: 'Listing status',
    enum: ['DRAFT', 'AVAILABLE', 'PAUSED', 'RENTED', 'SOLD', 'OFFLINE'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'AVAILABLE', 'PAUSED', 'RENTED', 'SOLD', 'OFFLINE'])
  status?: string;
}

// ===============================================
// F-P02: Dynamic Pricing Rules
// ===============================================
export class CreatePropertyPricingRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Christmas & New Year Peak Season' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Rule type', enum: ['SEASONAL', 'WEEKEND', 'CUSTOM'], example: 'SEASONAL' })
  @IsIn(['SEASONAL', 'WEEKEND', 'CUSTOM'])
  type: string;

  @ApiProperty({
    description: 'Modifier type',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'NIGHTLY_RATE'],
    example: 'PERCENTAGE',
  })
  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT', 'NIGHTLY_RATE'])
  modifierType: string;

  @ApiProperty({ description: 'Value (e.g. 20 for +20%, or specific nightly rate)', example: 20 })
  @IsNumber()
  modifierValue: number;

  @ApiPropertyOptional({ description: 'Rule start date', example: '2026-12-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Rule end date', example: '2027-01-05T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Active toggle', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================================
// F-P03: Availability Calendar & Blocks
// ===============================================
export class BlockCalendarDatesDto {
  @ApiProperty({ description: 'Start date of blocked period', example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of blocked period', example: '2026-09-05T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Reason for block', example: 'Owner private stay / renovation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetAvailabilityCalendarDto {
  @ApiPropertyOptional({ description: 'Start of calendar window (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End of calendar window (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ===============================================
// F-P04: Marketplace Search & Map Pins
// ===============================================
export class PropertyMarketplaceQueryDto {
  @ApiPropertyOptional({ description: 'Search term (title, city, state)' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Property type filter',
    enum: ['APARTMENT', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL', 'LAND'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Listing type filter',
    enum: ['SHORT_TERM_RENT', 'LONG_TERM_RENT', 'SALE'],
  })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum bedrooms count' })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Minimum bathrooms count' })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Center latitude for radius search' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Center longitude for radius search' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', default: 25 })
  @IsOptional()
  @IsNumber()
  radius?: number;

  @ApiPropertyOptional({ description: 'Filter by required amenities (comma separated or array)' })
  @IsOptional()
  amenities?: string[] | string;

  @ApiPropertyOptional({ description: 'Filter by pet-friendly properties only' })
  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by furnished properties only' })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['price', 'createdAt', 'rating', 'distance'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Results limit per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

// ===============================================
// F-P06 & F-P07: Rental Booking & Request Management
// ===============================================
export class CalculatePropertyQuoteDto {
  @ApiProperty({ description: 'Check-in date (ISO)', example: '2026-10-10' })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ description: 'Check-out date (ISO)', example: '2026-10-15' })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({ description: 'Number of guests', example: 3 })
  @IsNumber()
  @Min(1)
  guestsCount: number;
}

export class CreatePropertyBookingDto extends CalculatePropertyQuoteDto {
  @ApiPropertyOptional({ description: 'Preferred payment method', enum: ['PAYSTACK', 'CARD', 'TRANSFER'], default: 'PAYSTACK' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Special requests or notes for host' })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class ReviewBookingRequestDto {
  @ApiProperty({ description: 'Action on booking request', enum: ['ACCEPT', 'DECLINE'] })
  @IsIn(['ACCEPT', 'DECLINE'])
  action: 'ACCEPT' | 'DECLINE';

  @ApiPropertyOptional({ description: 'Reason for declining if action is DECLINE' })
  @IsOptional()
  @IsString()
  declineReason?: string;
}

// ===============================================
// F-P08: Guest-Owner Messaging
// ===============================================
export class SendPropertyMessageDto {
  @ApiProperty({ description: 'Message body text' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Optional booking ID associated with conversation' })
  @IsOptional()
  @IsString()
  bookingId?: string;
}

// ===============================================
// F-P09: Property Verification
// ===============================================
export class VerifyPropertyDto {
  @ApiProperty({ description: 'Owner identity verified badge', default: true })
  @IsBoolean()
  isOwnerVerified: boolean;

  @ApiProperty({ description: 'Property ownership deed verified badge', default: true })
  @IsBoolean()
  isOwnershipVerified: boolean;

  @ApiProperty({ description: 'Professional photography verified badge', default: false })
  @IsBoolean()
  isPhotoVerified: boolean;

  @ApiProperty({ description: 'Overall verification status', enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  verificationStatus: string;

  @ApiPropertyOptional({ description: 'Admin verification notes' })
  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

// ===============================================
// F-P10: Review & Rating System
// ===============================================
export class CreatePropertyReviewDto {
  @ApiPropertyOptional({ description: 'Booking ID associated with stay' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ description: 'Cleanliness rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanliness: number;

  @ApiProperty({ description: 'Accuracy rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  accuracy: number;

  @ApiProperty({ description: 'Check-in experience (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  checkIn: number;

  @ApiProperty({ description: 'Communication rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ description: 'Location rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  location: number;

  @ApiProperty({ description: 'Value rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;

  @ApiPropertyOptional({ description: 'Review comments / feedback' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class OwnerReviewResponseDto {
  @ApiProperty({ description: 'Host/Owner response text to guest review' })
  @IsString()
  response: string;
}

export class SubmitPropertyOwnerVerificationDto {
  @ApiProperty({ description: 'GCS URL of the deed document' })
  @IsString()
  deedUrl: string;

  @ApiProperty({ description: 'GCS URL of the utility bill document' })
  @IsString()
  utilityBillUrl: string;

  @ApiProperty({ description: 'GCS URL of the ID document' })
  @IsString()
  idUrl: string;
}

