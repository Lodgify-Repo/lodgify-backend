import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto, UpdateOfferStatusDto } from '../dto/offers.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Offers')
@ApiBearerAuth('access-token')
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Roles(Role.TRAVELER) // In this context, any authenticated user can make an offer
  @Post()
  @ApiOperation({ summary: 'Create' })
  async create(@Request() req: any, @Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(req.user.id, createOfferDto);
  }

  @Roles(Role.TRAVELER)
  @Get('my-offers')
  @ApiOperation({ summary: 'Get my offers' })
  async getMyOffers(@Request() req: any) {
    return this.offersService.getMyOffers(req.user.id);
  }

  @Roles(Role.AGENT)
  @Get('agent-offers')
  @ApiOperation({ summary: 'Get agent offers' })
  async getAgentOffers(@Request() req: any) {
    // Assuming the user's agentProfile id is accessible, or we use userId to match
    return this.offersService.getAgentOffers(req.user.id);
  }

  @Roles(Role.AGENT)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateOfferStatusDto) {
    return this.offersService.updateStatus(id, updateDto);
  }
}
