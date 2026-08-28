import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import {
  CreatePurchaseOfferExtendedDto,
  ReviewOfferDto,
  UpdateSalesPipelineStatusDto,
  PayEarnestDepositDto,
  RefundEarnestDepositDto,
  CreatePropertySaleDocumentDto,
  CreateBuyerSavedSearchDto,
  UpdateTransactionMilestoneDto,
} from '../dto/offers-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Property Sales - Offers, Escrow, Documents & Milestones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // F-PS02: Submit formal purchase offer
  @Post()
  @ApiOperation({ summary: 'F-PS02: Buyer submits formal purchase offer with contingencies, closing date, earnest deposit' })
  async create(@Request() req: any, @Body() createOfferDto: CreatePurchaseOfferExtendedDto) {
    return this.offersService.create(req.user.id, createOfferDto);
  }

  // F-PS02: Get my submitted offers
  @Get('my-offers')
  @ApiOperation({ summary: 'F-PS02: Get logged-in buyer submitted purchase offers' })
  async getMyOffers(@Request() req: any) {
    return this.offersService.getMyOffers(req.user.id);
  }

  // F-PS03: Property owner views all offers with price comparison against asking price
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('property/:propertyId')
  @ApiOperation({ summary: 'F-PS03: Property owner views all offers for a property with comparison against asking price' })
  async getOffersForProperty(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.offersService.getOffersForProperty(propertyId, req.user.id);
  }

  // F-PS03: Property owner reviews offer (ACCEPT, REJECT, COUNTER)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch(':id/review')
  @ApiOperation({ summary: 'F-PS03: Owner accepts, rejects, or counters offer with negotiation history' })
  async reviewOffer(
    @Request() req: any,
    @Param('id') offerId: string,
    @Body() dto: ReviewOfferDto,
  ) {
    return this.offersService.reviewOffer(offerId, req.user.id, dto);
  }

  // F-PS03: Buyer responds to seller counter-offer
  @Patch(':id/counter-response')
  @ApiOperation({ summary: 'F-PS03: Buyer responds to seller counter-offer (ACCEPT, REJECT, COUNTER)' })
  async buyerRespondToCounter(
    @Request() req: any,
    @Param('id') offerId: string,
    @Body() dto: { decision: 'ACCEPT' | 'REJECT' | 'COUNTER'; counterAmount?: number; counterConditions?: string },
  ) {
    return this.offersService.buyerRespondToCounter(offerId, req.user.id, dto);
  }

  // F-PS04: Owner updates property sales pipeline status
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch('pipeline/:propertyId')
  @ApiOperation({ summary: 'F-PS04: Update sales pipeline stage (Listed, Offer Received, Due Diligence, Closing, Sold)' })
  async updateSalesPipelineStatus(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: UpdateSalesPipelineStatusDto,
  ) {
    return this.offersService.updateSalesPipelineStatus(propertyId, req.user.id, dto);
  }

  // F-PS05: Buyer pays earnest deposit via Paystack to secure offer
  @Post(':id/earnest-deposit')
  @ApiOperation({ summary: 'F-PS05: Buyer pays earnest deposit via Paystack into escrow arrangement' })
  async payEarnestDeposit(
    @Request() req: any,
    @Param('id') offerId: string,
    @Body() dto: PayEarnestDepositDto,
  ) {
    return this.offersService.payEarnestDeposit(offerId, req.user.id, dto);
  }

  // F-PS05: Owner refunds earnest deposit
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch(':id/earnest-deposit/refund')
  @ApiOperation({ summary: 'F-PS05: Property owner executes earnest deposit refund' })
  async refundEarnestDeposit(
    @Request() req: any,
    @Param('id') offerId: string,
    @Body() dto: RefundEarnestDepositDto,
  ) {
    return this.offersService.refundEarnestDeposit(offerId, req.user.id, dto);
  }

  // F-PS07: Upload secure sale document (C of O, Survey Plan, Tax Clearance)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Post('documents')
  @ApiOperation({ summary: 'F-PS07: Upload secure title deed, survey plan, tax clearance for property sale' })
  async uploadSaleDocument(@Request() req: any, @Body() dto: CreatePropertySaleDocumentDto) {
    return this.offersService.uploadSaleDocument(req.user.id, dto);
  }

  // F-PS07: Get property documents (with permission verification for verified buyers/agents)
  @Get('documents/:propertyId')
  @ApiOperation({ summary: 'F-PS07: Get property documents with permission check for verified buyers, owners, agents' })
  async getPropertyDocuments(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.offersService.getPropertyDocuments(propertyId, req.user.id);
  }

  // F-PS09: Buyer creates saved search
  @Post('saved-searches')
  @ApiOperation({ summary: 'F-PS09: Buyer saves property search criteria and sets notification frequency' })
  async createSavedSearch(@Request() req: any, @Body() dto: CreateBuyerSavedSearchDto) {
    return this.offersService.createSavedSearch(req.user.id, dto);
  }

  // F-PS09: Buyer gets their saved searches
  @Get('saved-searches')
  @ApiOperation({ summary: 'F-PS09: Get all saved search alerts for logged-in buyer' })
  async getMySavedSearches(@Request() req: any) {
    return this.offersService.getMySavedSearches(req.user.id);
  }

  // F-PS09: Buyer deletes a saved search
  @Delete('saved-searches/:id')
  @ApiOperation({ summary: 'F-PS09: Delete a buyer saved search alert' })
  async deleteSavedSearch(@Request() req: any, @Param('id') id: string) {
    return this.offersService.deleteSavedSearch(id, req.user.id);
  }

  // F-PS10: Get closing transaction milestones for an accepted offer
  @Get(':id/milestones')
  @ApiOperation({ summary: 'F-PS10: Get 7 closing transaction milestones and progress for accepted offer' })
  async getOfferMilestones(@Request() req: any, @Param('id') offerId: string) {
    return this.offersService.getOfferMilestones(offerId, req.user.id);
  }

  // F-PS10: Update a transaction milestone
  @Patch('milestones/:id')
  @ApiOperation({ summary: 'F-PS10: Update milestone status, due date, document attachments, and notes' })
  async updateMilestone(
    @Request() req: any,
    @Param('id') milestoneId: string,
    @Body() dto: UpdateTransactionMilestoneDto,
  ) {
    return this.offersService.updateMilestone(milestoneId, req.user.id, dto);
  }

  // Agent offers
  @Roles(Role.AGENT)
  @Get('agent-offers')
  @ApiOperation({ summary: 'Get offers on properties represented by agent' })
  async getAgentOffers(@Request() req: any) {
    return this.offersService.getAgentOffers(req.user.id);
  }
}
