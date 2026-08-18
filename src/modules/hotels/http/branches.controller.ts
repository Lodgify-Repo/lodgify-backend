import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch, Delete } from '@nestjs/common';
import { BranchesService } from '../services/branches.service';
import { CreateBranchDto, UpdateBranchDto } from '../dto/hotels.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('hotels/:hotelId/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles(Role.HOTEL_OWNER)
  @Post()
  async create(@Param('hotelId') hotelId: string, @Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(hotelId, createBranchDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Get()
  async findAll(@Param('hotelId') hotelId: string) {
    return this.branchesService.findAll(hotelId);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Roles(Role.HOTEL_OWNER)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }
}
