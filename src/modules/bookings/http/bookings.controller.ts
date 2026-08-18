import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/bookings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(Role.GUEST)
  @Post()
  async create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Roles(Role.GUEST)
  @Get('my-bookings')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.findByGuest(req.user.id);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.FRONT_DESK)
  @Get('branch/:branchId')
  async getBranchBookings(@Param('branchId') branchId: string) {
    return this.bookingsService.findByBranch(branchId);
  }

  @Roles(Role.HOTEL_OWNER, Role.HOTEL_MANAGER, Role.FRONT_DESK)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateStatusDto);
  }
}
