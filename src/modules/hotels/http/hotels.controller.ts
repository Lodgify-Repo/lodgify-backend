import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { HotelsService } from '../services/hotels.service';
import { CreateHotelDto, UpdateHotelDto } from '../dto/hotels.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Hotels')
@ApiBearerAuth('access-token')
@Controller('hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Roles(Role.HOTEL_OWNER)
  @Post()
  @ApiOperation({ summary: 'Register a new hotel — requires admin approval (F-H01)' })
  async create(@Request() req: any, @Body() createHotelDto: CreateHotelDto) {
    return this.hotelsService.create(req.user.id, createHotelDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get('my-hotel')
  @ApiOperation({ summary: 'Get my hotel with branches' })
  async getMyHotel(@Request() req: any) {
    return this.hotelsService.findByOwner(req.user.id);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch('my-hotel')
  @ApiOperation({ summary: 'Update my hotel details' })
  async updateMyHotel(@Request() req: any, @Body() updateHotelDto: UpdateHotelDto) {
    return this.hotelsService.update(req.user.id, updateHotelDto);
  }
}

