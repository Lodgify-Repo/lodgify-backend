import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { HotelsService } from '../services/hotels.service';
import { CreateHotelDto, UpdateHotelDto } from '../dto/hotels.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Roles(Role.HOTEL_OWNER)
  @Post()
  async create(@Request() req: any, @Body() createHotelDto: CreateHotelDto) {
    return this.hotelsService.create(req.user.id, createHotelDto);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER)
  @Get('my-hotel')
  async getMyHotel(@Request() req: any) {
    return this.hotelsService.findByOwner(req.user.id);
  }

  @Roles(Role.HOTEL_OWNER)
  @Patch('my-hotel')
  async updateMyHotel(@Request() req: any, @Body() updateHotelDto: UpdateHotelDto) {
    return this.hotelsService.update(req.user.id, updateHotelDto);
  }
}
