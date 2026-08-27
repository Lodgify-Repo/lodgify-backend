import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { CreateRoomDto, UpdateRoomDto } from '../dto/rooms.dto';
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
}
