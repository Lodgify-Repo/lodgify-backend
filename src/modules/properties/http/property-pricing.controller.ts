import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PropertyPricingService } from '../services/property-pricing.service';
import { CreatePropertyPricingRuleDto } from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties - Pricing')
@Controller('properties/:propertyId/pricing')
export class PropertyPricingController {
  constructor(private readonly pricingService: PropertyPricingService) {}

  @Get('rules')
  @ApiOperation({ summary: 'F-P02: List dynamic pricing rules (seasonal, weekend, custom)' })
  async getPricingRules(@Param('propertyId') propertyId: string) {
    return this.pricingService.getPricingRules(propertyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Post('rules')
  @ApiOperation({ summary: 'F-P02: Create dynamic pricing rule (seasonal rate / weekend multiplier)' })
  async createPricingRule(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreatePropertyPricingRuleDto,
  ) {
    return this.pricingService.createPricingRule(propertyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'F-P02: Delete pricing rule' })
  async deletePricingRule(
    @Request() req: any,
    @Param('ruleId') ruleId: string,
  ) {
    return this.pricingService.deletePricingRule(ruleId, req.user.id);
  }
}
