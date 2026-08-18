import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { ViewingsService } from '../services/viewings.service';
import { ScheduleViewingDto, UpdateViewingStatusDto } from '../dto/viewings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('viewings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Roles(Role.GUEST)
  @Post()
  async schedule(@Request() req: any, @Body() scheduleDto: ScheduleViewingDto) {
    return this.viewingsService.schedule(req.user.id, scheduleDto);
  }

  @Roles(Role.GUEST)
  @Get('my-viewings')
  async getMyViewings(@Request() req: any) {
    return this.viewingsService.getMyViewings(req.user.id);
  }

  @Roles(Role.AGENT)
  @Get('agent-viewings')
  async getAgentViewings(@Request() req: any) {
    return this.viewingsService.getAgentViewings(req.user.id);
  }

  @Roles(Role.AGENT)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateViewingStatusDto) {
    return this.viewingsService.updateStatus(id, updateDto);
  }
}
