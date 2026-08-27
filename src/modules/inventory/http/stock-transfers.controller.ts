import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Request, Query } from '@nestjs/common';
import { StockTransfersService } from '../services/stock-transfers.service';
import { CreateStockTransferDto, UpdateTransferStatusDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Stock Transfers')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockTransfersController {
  constructor(private readonly transfersService: StockTransfersService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-I07: Create stock transfer request' })
  async createTransfer(
    @Request() req: any,
    @Param('branchId') branchId: string, 
    @Body() dto: CreateStockTransferDto
  ) {
    return this.transfersService.createTransfer(branchId, req.user.id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-I07: Get stock transfers' })
  @ApiQuery({ name: 'role', enum: ['FROM', 'TO'], description: 'View outgoing or incoming transfers' })
  async getTransfers(
    @Param('branchId') branchId: string,
    @Query('role') role: 'FROM' | 'TO' = 'FROM'
  ) {
    return this.transfersService.getTransfers(branchId, role);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'F-I07: Update transfer status (Approve, Ship, Receive)' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string, 
    @Body() dto: UpdateTransferStatusDto
  ) {
    return this.transfersService.updateStatus(id, dto, req.user.id);
  }
}
