import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Delete, Request } from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import { CreateSupplierDto, RateSupplierDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory Suppliers')
@ApiBearerAuth('access-token')
@Controller('inventory/suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-I09: Create Supplier' })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK)
  @Get()
  @ApiOperation({ summary: 'F-I09: Get Suppliers' })
  async getSuppliers() {
    return this.suppliersService.getSuppliers();
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'F-I09: Get Supplier Details' })
  async getSupplierDetails(@Param('id') id: string) {
    return this.suppliersService.getSupplierDetails(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'F-I09: Update Supplier' })
  async updateSupplier(@Param('id') id: string, @Body() dto: Partial<CreateSupplierDto>) {
    return this.suppliersService.updateSupplier(id, dto);
  }

  @Roles(Role.HOTEL_OWNER)
  @Delete(':id')
  @ApiOperation({ summary: 'F-I09: Delete Supplier' })
  async deleteSupplier(@Param('id') id: string) {
    return this.suppliersService.deleteSupplier(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post(':id/ratings')
  @ApiOperation({ summary: 'F-I09: Rate Supplier' })
  async rateSupplier(@Request() req: any, @Param('id') id: string, @Body() dto: RateSupplierDto) {
    return this.suppliersService.rateSupplier(id, req.user.id, dto);
  }
}
