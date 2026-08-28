import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { MenuItemsService } from '../services/menu-items.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/food.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Menu Items')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-F02: Create menu item' })
  async create(@Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER, Role.RESTAURANT_STAFF, Role.TRAVELER)
  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'F-F02: Get menu items by category' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    return this.menuItemsService.findByCategory(categoryId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER, Role.RESTAURANT_STAFF, Role.TRAVELER)
  @Get(':id')
  @ApiOperation({ summary: 'F-F02: Get menu item details' })
  async findById(@Param('id') id: string) {
    return this.menuItemsService.findById(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'F-F02: Update menu item' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemsService.update(id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-F02: Delete menu item (soft)' })
  async delete(@Param('id') id: string) {
    return this.menuItemsService.delete(id);
  }
}
