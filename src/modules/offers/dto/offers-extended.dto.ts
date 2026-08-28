import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===============================================
// F-PS02: Offer Submission
// ===============================================
export class CreatePurchaseOfferExtendedDto {
  @ApiProperty({ description: 'Target Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Offered purchase amount', example: 120000000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Financing method (CASH or MORTGAGE)',
    enum: ['CASH', 'MORTGAGE'],
    default: 'CASH',
  })
  @IsOptional()
  @IsIn(['CASH', 'MORTGAGE'])
  financingMethod?: 'CASH' | 'MORTGAGE';

  @ApiPropertyOptional({ description: 'Proposed closing date (ISO string)', example: '2026-11-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  proposedClosingDate?: string;

  @ApiPropertyOptional({
    description: 'Offer contingencies',
    example: ['INSPECTION', 'APPRAISAL', 'FINANCING', 'TITLE_SEARCH'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contingencies?: string[];

  @ApiPropertyOptional({ description: 'Earnest money deposit amount', example: 5000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  earnestDepositAmount?: number;

  @ApiPropertyOptional({ description: 'URL of attached pre-approval letter or proof of funds' })
  @IsOptional()
  @IsString()
  preApprovalLetterUrl?: string;

  @ApiPropertyOptional({ description: 'Offer message or conditions to seller' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Offer expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ===============================================
// F-PS03: Counter-Offer & Negotiation
// ===============================================
export class CounterOfferDto {
  @ApiProperty({ description: 'Counter-offered purchase price', example: 125000000 })
  @IsNumber()
  @Min(1)
  counterAmount: number;

  @ApiPropertyOptional({ description: 'Counter terms & conditions' })
  @IsOptional()
  @IsString()
  counterConditions?: string;

  @ApiPropertyOptional({ description: 'Counter-offer expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ReviewOfferDto {
  @ApiProperty({ description: 'Decision on offer', enum: ['ACCEPT', 'REJECT', 'COUNTER'] })
  @IsIn(['ACCEPT', 'REJECT', 'COUNTER'])
  decision: 'ACCEPT' | 'REJECT' | 'COUNTER';

  @ApiPropertyOptional({ description: 'Counter amount if decision is COUNTER' })
  @IsOptional()
  @IsNumber()
  counterAmount?: number;

  @ApiPropertyOptional({ description: 'Counter conditions if decision is COUNTER' })
  @IsOptional()
  @IsString()
  counterConditions?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection if decision is REJECT' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

// ===============================================
// F-PS04: Sales Pipeline Tracking
// ===============================================
export class UpdateSalesPipelineStatusDto {
  @ApiProperty({
    description: 'New sales pipeline stage',
    enum: ['LISTED', 'OFFER_RECEIVED', 'NEGOTIATING', 'OFFER_ACCEPTED', 'DUE_DILIGENCE', 'CLOSING', 'SOLD'],
  })
  @IsIn(['LISTED', 'OFFER_RECEIVED', 'NEGOTIATING', 'OFFER_ACCEPTED', 'DUE_DILIGENCE', 'CLOSING', 'SOLD'])
  status: string;

  @ApiPropertyOptional({ description: 'Pipeline stage notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===============================================
// F-PS05: Earnest Deposit Handling
// ===============================================
export class PayEarnestDepositDto {
  @ApiProperty({ description: 'Paystack payment reference' })
  @IsString()
  paymentReference: string;

  @ApiProperty({ description: 'Amount paid', example: 5000000 })
  @IsNumber()
  amount: number;
}

export class RefundEarnestDepositDto {
  @ApiProperty({ description: 'Reason for earnest deposit refund' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Percentage to refund (1-100)', default: 100 })
  @IsOptional()
  @IsNumber()
  refundPercentage?: number;
}

// ===============================================
// F-PS07: Document Management
// ===============================================
export class CreatePropertySaleDocumentDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Document title', example: 'Certificate of Occupancy (C of O)' })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Document type',
    enum: ['TITLE_DEED', 'SURVEY_PLAN', 'TAX_CLEARANCE', 'BUILDING_APPROVAL', 'OTHER'],
  })
  @IsIn(['TITLE_DEED', 'SURVEY_PLAN', 'TAX_CLEARANCE', 'BUILDING_APPROVAL', 'OTHER'])
  docType: string;

  @ApiProperty({ description: 'File storage URL' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Whether document contains confidential information', default: true })
  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;

  @ApiPropertyOptional({
    description: 'Access restriction level',
    enum: ['RESTRICTED', 'PUBLIC', 'VERIFIED_BUYERS_ONLY'],
    default: 'RESTRICTED',
  })
  @IsOptional()
  @IsIn(['RESTRICTED', 'PUBLIC', 'VERIFIED_BUYERS_ONLY'])
  accessLevel?: string;
}

// ===============================================
// F-PS09: Buyer Saved Searches
// ===============================================
export class CreateBuyerSavedSearchDto {
  @ApiProperty({ description: 'Saved search name', example: '4-Bed Lekki Luxury Villas under 200M' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Search criteria map',
    example: {
      minPrice: 50000000,
      maxPrice: 200000000,
      bedrooms: 4,
      propertyType: 'villa',
      city: 'Lekki',
      titleType: 'C_OF_O',
    },
  })
  criteria: Record<string, any>;

  @ApiPropertyOptional({ description: 'Enable email alerts on new matches', default: true })
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Notification frequency',
    enum: ['INSTANT', 'DAILY', 'WEEKLY'],
    default: 'INSTANT',
  })
  @IsOptional()
  @IsIn(['INSTANT', 'DAILY', 'WEEKLY'])
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

// ===============================================
// F-PS10: Transaction Milestones
// ===============================================
export class UpdateTransactionMilestoneDto {
  @ApiProperty({
    description: 'Milestone completion status',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'WAIVED'],
  })
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'WAIVED'])
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'WAIVED';

  @ApiPropertyOptional({ description: 'Milestone due date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Supporting document attachment URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ description: 'Milestone completion notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
