import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { PropertyCalendarService } from '../services/property-calendar.service';
import { BlockCalendarDatesDto, GetAvailabilityCalendarDto } from '../dto/properties-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties - Calendar')
@Controller('properties/:propertyId/calendar')
export class PropertyCalendarController {
  constructor(private readonly calendarService: PropertyCalendarService) {}

  @Get()
  @ApiOperation({ summary: 'F-P03: Get property availability calendar (booked, blocked, available)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAvailability(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.calendarService.getAvailabilityCalendar(propertyId, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Post('blocks')
  @ApiOperation({ summary: 'F-P03: Block dates on calendar' })
  async blockDates(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
    @Body() dto: BlockCalendarDatesDto,
  ) {
    return this.calendarService.blockDates(propertyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'F-P03: Unblock dates on calendar' })
  async unblockDates(
    @Request() req: any,
    @Param('blockId') blockId: string,
  ) {
    return this.calendarService.unblockDates(blockId, req.user.id);
  }

  @Get('export.ics')
  @ApiOperation({ summary: 'F-P03: Export calendar to RFC 5545 iCal stream for Airbnb/VRBO/Google Calendar sync' })
  @ApiProduces('text/calendar')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="calendar.ics"')
  async exportICal(@Param('propertyId') propertyId: string, @Res() res: any) {
    const icsData = await this.calendarService.generateICalStream(propertyId);
    res.send(icsData);
  }
}
