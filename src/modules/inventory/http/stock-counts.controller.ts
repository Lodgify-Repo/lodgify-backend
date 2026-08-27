import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Request } from '@nestjs/common';
import { StockCountsService } from '../services/stock-counts.service';
import { InitiateStockCountDto, RecordCountItemDto, ResolveVarianceDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Stock Counts')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory/stock-counts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockCountsController {
  constructor(private readonly countsService: StockCountsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-I10: Initiate Stock Count' })
  async initiateCount(@Request() req: any, @Param('branchId') branchId: string, @Body() dto: InitiateStockCountDto) {
    return this.countsService.initiateCount(branchId, req.user.id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-I10: List Stock Counts' })
  async getCounts(@Param('branchId') branchId: string) {
    return this.countsService.getCounts(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'F-I10: Get Stock Count Details (Variance Report)' })
  async getCountDetails(@Param('id') id: string) {
    return this.countsService.getCountDetails(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.HOUSEKEEPING, Role.RESTAURANT_STAFF)
  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'F-I10: Record Actual Quantity' })
  async recordActualQuantity(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: RecordCountItemDto) {
    return this.countsService.recordActualQuantity(id, itemId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post(':id/items/:itemId/resolve')
  @ApiOperation({ summary: 'F-I10: Resolve Variance (Auto-Adjust or Flag)' })
  async resolveVariance(@Request() req: any, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: ResolveVarianceDto) {
    return this.countsService.resolveVariance(id, itemId, dto, req.user.id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post(':id/complete')
  @ApiOperation({ summary: 'F-I10: Complete Stock Count' })
  async completeCount(@Param('id') id: string) {
    return this.countsService.completeCount(id);
  }
}
