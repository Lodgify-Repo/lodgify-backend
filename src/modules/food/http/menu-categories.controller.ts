import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { MenuCategoriesService } from '../services/menu-categories.service';
import { CreateMenuCategoryDto, UpdateMenuCategoryDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Menu Categories')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuCategoriesController {
  constructor(private readonly categoriesService: MenuCategoriesService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-F01: Create menu category' })
  async create(@Param('branchId') branchId: string, @Body() dto: CreateMenuCategoryDto) {
    return this.categoriesService.create(branchId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER, Role.RESTAURANT_STAFF, Role.TRAVELER)
  @Get()
  @ApiOperation({ summary: 'F-F01: List menu categories' })
  async findAll(@Param('branchId') branchId: string) {
    return this.categoriesService.findAll(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'F-F01: Update menu category' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-F01: Delete menu category (soft)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
