import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { CreateInventoryItemDto, InventoryTransactionDto } from '../dto/inventory.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('branches/:branchId/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Post('items')
  async createItem(@Param('branchId') branchId: string, @Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(branchId, createDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Get('items')
  async getItems(@Param('branchId') branchId: string) {
    return this.inventoryService.getItemsByBranch(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Post('items/:itemId/transactions')
  async recordTransaction(
    @Request() req: any, 
    @Param('itemId') itemId: string, 
    @Body() dto: InventoryTransactionDto
  ) {
    return this.inventoryService.recordTransaction(itemId, req.user.id, dto);
  }
}
