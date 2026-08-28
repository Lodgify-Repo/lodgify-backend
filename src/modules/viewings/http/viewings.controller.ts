import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { ViewingsService } from '../services/viewings.service';
import { ScheduleSaleViewingDto, UpdateViewingStatusExtendedDto } from '../dto/viewings-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Property Sales - Viewing Coordination')
@ApiBearerAuth('access-token')
@Controller('viewings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post()
  @ApiOperation({ summary: 'F-PS06: Schedule property viewing (Open House, Private Showing, Virtual Tour)' })
  async schedule(@Request() req: any, @Body() scheduleDto: ScheduleSaleViewingDto) {
    return this.viewingsService.schedule(req.user.id, scheduleDto);
  }

  @Get('my-viewings')
  @ApiOperation({ summary: 'F-PS06: Get logged-in buyer scheduled viewings' })
  async getMyViewings(@Request() req: any) {
    return this.viewingsService.getMyViewings(req.user.id);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('owner/viewings')
  @ApiOperation({ summary: 'F-PS06: Get property owner scheduled viewings across all listings' })
  async getOwnerViewings(@Request() req: any) {
    return this.viewingsService.getOwnerViewings(req.user.id);
  }

  @Roles(Role.AGENT)
  @Get('agent-viewings')
  @ApiOperation({ summary: 'F-PS06: Get agent viewings for authorized properties' })
  async getAgentViewings(@Request() req: any) {
    return this.viewingsService.getAgentViewings(req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'F-PS06: Confirm, reschedule, or complete viewing appointment' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateViewingStatusExtendedDto) {
    return this.viewingsService.updateStatus(id, updateDto);
  }
}
