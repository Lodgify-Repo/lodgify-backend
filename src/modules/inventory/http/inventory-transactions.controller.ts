import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryTransactionDto } from '../dto/inventory.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Transactions')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryTransactionsController {
  constructor(private readonly transactionsService: InventoryTransactionsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Post('items/:itemId/transactions')
  @ApiOperation({ summary: 'F-I04/F-I05: Record inventory transaction (IN/OUT/ADJUST)' })
  async recordTransaction(
    @Request() req: any, 
    @Param('itemId') itemId: string, 
    @Body() dto: InventoryTransactionDto
  ) {
    return this.transactionsService.recordTransaction(itemId, req.user.id, dto);
  }
}
