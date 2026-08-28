import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  IsEmail,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===============================================
// F-AG01: Agent Profile Creation & Updates
// ===============================================
export class CreateAgentProfileExtendedDto {
  @ApiProperty({
    description: 'Account type (INDIVIDUAL or COMPANY)',
    enum: ['INDIVIDUAL', 'COMPANY'],
    default: 'INDIVIDUAL',
  })
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  accountType: 'INDIVIDUAL' | 'COMPANY';

  @ApiPropertyOptional({ description: 'Agency or company name (required if company)', example: 'Premier Realty Ltd' })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiProperty({ description: 'Government/Board license or accreditation number', example: 'LIC-2026-00892' })
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Professional biography / introduction' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Profile headshot or agency logo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Areas of specialization',
    example: ['LUXURY_VILLAS', 'SHORT_TERM_RENTALS', 'COMMERCIAL', 'RESIDENTIAL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({
    description: 'Geographic neighborhoods / areas served',
    example: ['Lekki Phase 1', 'Victoria Island', 'Ikoyi', 'Epe'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasServed?: string[];

  @ApiPropertyOptional({ description: 'Years of professional real estate experience', example: 8 })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Professional website URL', example: 'https://premierrealty.ng' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Social links map or JSON string',
    example: { instagram: '@premierrealty', linkedin: 'linkedin.com/in/premierrealty' },
  })
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Bank account payout details',
    example: { bankName: 'Zenith Bank', accountNumber: '1234567890', accountName: 'Premier Realty Ltd' },
  })
  @IsOptional()
  bankAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
  };
}

export class UpdateAgentProfileExtendedDto extends CreateAgentProfileExtendedDto {}

// ===============================================
// F-AG02: Agent Verification
// ===============================================
export class SubmitAgentVerificationDto {
  @ApiProperty({ description: 'GCS or document URL of professional license' })
  @IsString()
  licenseUrl: string;

  @ApiPropertyOptional({ description: 'GCS or document URL of CAC / company registration' })
  @IsOptional()
  @IsString()
  companyRegistrationUrl?: string;

  @ApiPropertyOptional({ description: 'GCS or document URL of government ID card / passport' })
  @IsOptional()
  @IsString()
  idDocumentUrl?: string;
}

export class VerifyAgentDto {
  @ApiProperty({ description: 'Verification decision', enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Admin verification notes' })
  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @ApiPropertyOptional({ description: 'Tier upgrade', enum: ['STANDARD', 'PREMIUM'], default: 'STANDARD' })
  @IsOptional()
  @IsIn(['STANDARD', 'PREMIUM'])
  tier?: string;
}

// ===============================================
// F-AG03 & F-AG04: Property Authorization & Management
// ===============================================
export class RequestPropertyAuthorizationDto {
  @ApiProperty({ description: 'Property ID to request authorization for' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Pitch / introduction message to the property owner' })
  @IsOptional()
  @IsString()
  pitchMessage?: string;

  @ApiPropertyOptional({ description: 'Proposed commission rate percentage', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  proposedRate?: number;
}

export class ReviewAuthorizationRequestDto {
  @ApiProperty({ description: 'Decision on authorization request', enum: ['APPROVED', 'DECLINED'] })
  @IsIn(['APPROVED', 'DECLINED'])
  decision: 'APPROVED' | 'DECLINED';

  @ApiPropertyOptional({ description: 'Agreed commission rate percentage (if approved)', example: 6.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  agreedRate?: number;

  @ApiPropertyOptional({ description: 'Reason if declined' })
  @IsOptional()
  @IsString()
  declineReason?: string;
}

export class InviteAgentDto {
  @ApiProperty({ description: 'Property ID to invite agent for' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Agent profile ID to invite' })
  @IsString()
  agentId: string;

  @ApiPropertyOptional({ description: 'Offered commission rate percentage', example: 7.0 })
  @IsOptional()
  @IsNumber()
  proposedRate?: number;

  @ApiPropertyOptional({ description: 'Custom invitation message' })
  @IsOptional()
  @IsString()
  message?: string;
}

// ===============================================
// F-AG07: Lead Tracking Pipeline
// ===============================================
export class CreateLeadDto {
  @ApiProperty({ description: 'Prospect client full name', example: 'Chidi Okafor' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Prospect email', example: 'chidi@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Prospect phone number', example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Associated Property ID' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'Lead acquisition source',
    enum: ['REFERRAL_LINK', 'DIRECT_INQUIRY', 'SOCIAL', 'MANUAL'],
    default: 'MANUAL',
  })
  @IsOptional()
  @IsIn(['REFERRAL_LINK', 'DIRECT_INQUIRY', 'SOCIAL', 'MANUAL'])
  source?: string;

  @ApiPropertyOptional({ description: 'Estimated transaction value', example: 75000000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Initial notes or prospect requirements' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({
    description: 'New pipeline status',
    enum: ['NEW', 'CONTACTED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'],
  })
  @IsIn(['NEW', 'CONTACTED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'])
  status: string;

  @ApiPropertyOptional({ description: 'Status update notes / outcome summary' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===============================================
// F-AG08: Viewing Scheduling
// ===============================================
export class ScheduleViewingDto {
  @ApiProperty({ description: 'Property ID to schedule viewing for' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Lead ID associated with prospect' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ description: 'Client full name', example: 'Amaka Bello' })
  @IsString()
  clientName: string;

  @ApiProperty({ description: 'Client email', example: 'amaka@example.com' })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({ description: 'Client phone', example: '+2348098765432' })
  @IsString()
  clientPhone: string;

  @ApiProperty({ description: 'Scheduled viewing date & time (ISO)', example: '2026-09-15T14:00:00.000Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ description: 'Viewing notes or special client requests' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewViewingDto {
  @ApiProperty({
    description: 'Viewing status update',
    enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
  })
  @IsIn(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
  status: string;

  @ApiPropertyOptional({ description: 'Feedback or rescheduling notes' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ description: 'New scheduled date if rescheduled (ISO)' })
  @IsOptional()
  @IsDateString()
  newScheduledDate?: string;
}

// ===============================================
// F-AG10: Commission Payout
// ===============================================
export class InitiateCommissionPayoutDto {
  @ApiProperty({ description: 'Commission record ID to pay out' })
  @IsString()
  commissionId: string;

  @ApiProperty({ description: 'Payout method', enum: ['PAYSTACK', 'BANK_TRANSFER'], default: 'PAYSTACK' })
  @IsIn(['PAYSTACK', 'BANK_TRANSFER'])
  payoutMethod: 'PAYSTACK' | 'BANK_TRANSFER';

  @ApiPropertyOptional({ description: 'Payment reference or transaction ID' })
  @IsOptional()
  @IsString()
  payoutReference?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded receipt / proof of transfer' })
  @IsOptional()
  @IsString()
  payoutReceiptUrl?: string;
}

// ===============================================
// F-AG12: Agent Directory & Client Reviews
// ===============================================
export class CreateAgentReviewDto {
  @ApiProperty({ description: 'Professionalism rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalism: number;

  @ApiProperty({ description: 'Market knowledge rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  marketKnowledge: number;

  @ApiProperty({ description: 'Responsiveness rating (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  responsiveness: number;

  @ApiPropertyOptional({ description: 'Client review comments' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AgentDirectoryQueryDto {
  @ApiPropertyOptional({ description: 'Search name, agency, or license' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by specialization', example: 'LUXURY_VILLAS' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Filter by area served', example: 'Lekki' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Account type', enum: ['INDIVIDUAL', 'COMPANY'] })
  @IsOptional()
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  accountType?: 'INDIVIDUAL' | 'COMPANY';

  @ApiPropertyOptional({ description: 'Verified agents only', default: true })
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Results limit per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
