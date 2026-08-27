import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { InventoryItemsService } from '../services/inventory-items.service';
import { CreateInventoryItemDto } from '../dto/inventory.dto';
import { CreateStorageLocationDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Items & Locations')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryItemsController {
  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post('items')
  @ApiOperation({ summary: 'F-I02: Create inventory item' })
  async createItem(@Param('branchId') branchId: string, @Body() createDto: CreateInventoryItemDto) {
    return this.inventoryItemsService.createItem(branchId, createDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Get('items')
  @ApiOperation({ summary: 'F-I02/F-I03: Get items and balances' })
  async getItems(@Param('branchId') branchId: string) {
    return this.inventoryItemsService.getItemsByBranch(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch('items/:id')
  @ApiOperation({ summary: 'F-I02: Update inventory item' })
  async updateItem(@Param('id') id: string, @Body() dto: Partial<CreateInventoryItemDto>) {
    return this.inventoryItemsService.updateItem(id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post('locations')
  @ApiOperation({ summary: 'F-I03: Create storage location' })
  async createLocation(@Param('branchId') branchId: string, @Body() dto: CreateStorageLocationDto) {
    return this.inventoryItemsService.createLocation(branchId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Get('locations')
  @ApiOperation({ summary: 'F-I03: Get storage locations' })
  async getLocations(@Param('branchId') branchId: string) {
    return this.inventoryItemsService.getLocations(branchId);
  }
}
