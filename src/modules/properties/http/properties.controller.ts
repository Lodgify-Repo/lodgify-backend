import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Patch,
  Delete,
  Request,
} from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';
import {
  CreatePropertyExtendedDto,
  UpdatePropertyExtendedDto,
  VerifyPropertyDto,
  SubmitPropertyOwnerVerificationDto,
} from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties - Listings')
@ApiBearerAuth('access-token')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Post()
  @ApiOperation({ summary: 'F-P01: Create property listing with photos, floor plan, rules, amenities' })
  async create(@Request() req: any, @Body() createPropertyDto: CreatePropertyExtendedDto) {
    return this.propertiesService.create(createPropertyDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('owner/my-listings')
  @ApiOperation({ summary: 'F-P11: Get owner listings with views, bookings, inquiries metrics' })
  async getOwnerProperties(@Request() req: any) {
    return this.propertiesService.getOwnerProperties(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'F-P05: Rich property detail page (gallery, rules, host, reviews, rating breakdown)' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch(':id')
  @ApiOperation({ summary: 'F-P01 & F-P11: Update property details' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyExtendedDto,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'F-P11: Pause, resume, or activate listing status' })
  async setListingStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.propertiesService.setListingStatus(id, status, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-P11: Delete / offline property listing' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.propertiesService.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/verify')
  @ApiOperation({ summary: 'F-P09: Verify property badges (owner identity, deed, pro photography)' })
  async verifyProperty(@Param('id') id: string, @Body() dto: VerifyPropertyDto) {
    return this.propertiesService.verifyProperty(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER)
  @Post('verify-owner')
  @ApiOperation({ summary: 'F-P09: Submit property owner verification documents' })
  async submitOwnerVerification(@Request() req: any, @Body() dto: SubmitPropertyOwnerVerificationDto) {
    return this.propertiesService.submitOwnerVerification(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('owner-profiles/:id/verify')
  @ApiOperation({ summary: 'F-P09: Approve or reject property owner verification profile' })
  async verifyOwner(@Param('id') id: string, @Body('status') status: string) {
    return this.propertiesService.verifyOwner(id, status);
  }
}
