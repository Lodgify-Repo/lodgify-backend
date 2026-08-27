import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch, Delete } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateInventoryCategoryDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Categories')
@ApiBearerAuth('access-token')
@Controller('hotels/:hotelId/inventory/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(Role.HOTEL_OWNER)
  @Post()
  @ApiOperation({ summary: 'F-I01: Create inventory category' })
  async createCategory(@Param('hotelId') hotelId: string, @Body() dto: CreateInventoryCategoryDto) {
    return this.categoriesService.create(hotelId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-I01: List inventory categories' })
  async getCategories(@Param('hotelId') hotelId: string) {
    return this.categoriesService.findAll(hotelId);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch(':id')
  @ApiOperation({ summary: 'F-I01: Update inventory category' })
  async updateCategory(@Param('id') id: string, @Body() dto: Partial<CreateInventoryCategoryDto>) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.HOTEL_OWNER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-I01: Delete inventory category' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
