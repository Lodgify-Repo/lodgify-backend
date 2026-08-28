import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { DailySpecialsService } from '../services/daily-specials.service';
import { CreateDailySpecialDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Daily Specials')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/specials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailySpecialsController {
  constructor(private readonly specialsService: DailySpecialsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-F08: Create daily special / promotion' })
  async create(@Param('branchId') branchId: string, @Body() dto: CreateDailySpecialDto) {
    return this.specialsService.create(branchId, dto);
  }

  @Roles(Role.TRAVELER, Role.FRONT_DESK, Role.RESTAURANT_STAFF, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Get('active')
  @ApiOperation({ summary: 'F-F08: Get currently active specials' })
  async getActiveSpecials(@Param('branchId') branchId: string) {
    return this.specialsService.getActiveSpecials(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-F08: List all specials (including expired)' })
  async getAllSpecials(@Param('branchId') branchId: string) {
    return this.specialsService.getAllSpecials(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-F08: Deactivate daily special' })
  async deactivate(@Param('id') id: string) {
    return this.specialsService.deactivate(id);
  }
}
