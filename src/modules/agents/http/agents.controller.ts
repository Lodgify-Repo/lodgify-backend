import { Controller, Post, Get, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { AgentsService } from '../services/agents.service';
import { CreateAgentProfileDto, UpdateAgentProfileDto } from '../dto/agents.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createProfile(@Request() req: any, @Body() createDto: CreateAgentProfileDto) {
    return this.agentsService.createProfile(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @Get('my-profile')
  async getMyProfile(@Request() req: any) {
    return this.agentsService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @Patch('my-profile')
  async updateMyProfile(@Request() req: any, @Body() updateDto: UpdateAgentProfileDto) {
    return this.agentsService.updateProfile(req.user.id, updateDto);
  }

  @Get()
  async getAllAgents() {
    return this.agentsService.getAllAgents();
  }
}
