import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Request } from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto, UpdatePropertyDto, SubmitPropertyOwnerVerificationDto } from '../dto/properties.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties')
@ApiBearerAuth('access-token')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Post()
  @ApiOperation({ summary: 'Create' })
  async create(@Request() req: any, @Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Find all' })
  async findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update' })
  async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER)
  @Post('verify-owner')
  @ApiOperation({ summary: 'Submit property owner verification documents' })
  async submitOwnerVerification(@Request() req: any, @Body() dto: SubmitPropertyOwnerVerificationDto) {
    return this.propertiesService.submitOwnerVerification(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('owner-profiles/:id/verify')
  @ApiOperation({ summary: 'Approve or reject property owner' })
  async verifyOwner(@Param('id') id: string, @Body('status') status: string) {
    return this.propertiesService.verifyOwner(id, status);
  }
}
