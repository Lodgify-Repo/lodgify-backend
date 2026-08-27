import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Request } from '@nestjs/common';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePOStatusDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Purchase Orders')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/inventory/purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-I08: Create Purchase Order' })
  async createPO(@Param('branchId') branchId: string, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.createPO(branchId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get()
  @ApiOperation({ summary: 'F-I08: Get Purchase Orders' })
  async getPOs(@Param('branchId') branchId: string) {
    return this.poService.getPOs(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'F-I08: Update PO Status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string, 
    @Body() dto: UpdatePOStatusDto
  ) {
    return this.poService.updateStatus(id, dto, req.user.id);
  }
}
