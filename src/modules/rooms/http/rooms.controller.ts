import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch, Query } from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, CreateRoomMaintenanceDto } from '../dto/rooms.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Rooms')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create' })
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING)
  @Get()
  @ApiOperation({ summary: 'Find all by branch' })
  async findAllByBranch(@Param('branchId') branchId: string) {
    return this.roomsService.findAllByBranch(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK)
  @Patch(':id')
  @ApiOperation({ summary: 'Update' })
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update room status' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateRoomStatusDto) {
    return this.roomsService.updateStatus(id, updateStatusDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post(':id/maintenance')
  @ApiOperation({ summary: 'Schedule maintenance' })
  async scheduleMaintenance(@Param('id') id: string, @Body() dto: CreateRoomMaintenanceDto) {
    return this.roomsService.scheduleMaintenance(id, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.HOUSEKEEPING)
  @Get(':id/maintenance')
  @ApiOperation({ summary: 'Get room maintenance history' })
  async getRoomMaintenance(@Param('id') id: string) {
    return this.roomsService.getRoomMaintenance(id);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK)
  @Get('calendar/availability')
  @ApiOperation({ summary: 'Get availability calendar' })
  async getAvailabilityCalendar(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.roomsService.getAvailabilityCalendar(branchId, startDate, endDate);
  }
}
