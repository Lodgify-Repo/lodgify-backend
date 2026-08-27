import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { BranchesService } from '../services/branches.service';
import { CreateBranchDto, UpdateBranchDto } from '../dto/hotels.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@Controller('hotels/:hotelId/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles(Role.HOTEL_OWNER)
  @Post()
  @ApiOperation({ summary: 'Create a new branch under a hotel (F-H02)' })
  async create(@Param('hotelId') hotelId: string, @Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(hotelId, createBranchDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'List all branches for a hotel' })
  async findAll(@Param('hotelId') hotelId: string) {
    return this.branchesService.findAll(hotelId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Get branch details' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update branch profile — details, photos, amenities, policies, food service (F-H03)' })
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Temporarily deactivate a branch — removes from search (F-H05)' })
  async deactivate(@Param('id') id: string) {
    return this.branchesService.deactivate(id);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a deactivated branch — returns to search (F-H05)' })
  async reactivate(@Param('id') id: string) {
    return this.branchesService.reactivate(id);
  }
}
