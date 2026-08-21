import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { RoomTypesService } from '../services/room-types.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto, CreatePricingRuleDto } from '../dto/rooms.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Room Types')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/room-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create' })
  async create(@Param('branchId') branchId: string, @Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypesService.create(branchId, createRoomTypeDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.FRONT_DESK)
  @Get()
  @ApiOperation({ summary: 'Find all' })
  async findAll(@Param('branchId') branchId: string) {
    return this.roomTypesService.findAll(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update' })
  async update(@Param('id') id: string, @Body() updateRoomTypeDto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, updateRoomTypeDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Post(':id/pricing-rules')
  @ApiOperation({ summary: 'Add pricing rule' })
  async addPricingRule(@Param('id') id: string, @Body() createPricingRuleDto: CreatePricingRuleDto) {
    return this.roomTypesService.addPricingRule(id, createPricingRuleDto);
  }
}
