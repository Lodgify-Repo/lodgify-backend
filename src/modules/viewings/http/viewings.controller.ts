import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { ViewingsService } from '../services/viewings.service';
import { ScheduleViewingDto, UpdateViewingStatusDto } from '../dto/viewings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Viewings')
@ApiBearerAuth('access-token')
@Controller('viewings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Roles(Role.TRAVELER)
  @Post()
  @ApiOperation({ summary: 'Schedule' })
  async schedule(@Request() req: any, @Body() scheduleDto: ScheduleViewingDto) {
    return this.viewingsService.schedule(req.user.id, scheduleDto);
  }

  @Roles(Role.TRAVELER)
  @Get('my-viewings')
  @ApiOperation({ summary: 'Get my viewings' })
  async getMyViewings(@Request() req: any) {
    return this.viewingsService.getMyViewings(req.user.id);
  }

  @Roles(Role.AGENT)
  @Get('agent-viewings')
  @ApiOperation({ summary: 'Get agent viewings' })
  async getAgentViewings(@Request() req: any) {
    return this.viewingsService.getAgentViewings(req.user.id);
  }

  @Roles(Role.AGENT)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateViewingStatusDto) {
    return this.viewingsService.updateStatus(id, updateDto);
  }
}
