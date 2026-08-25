import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { AgentsService } from '../services/agents.service';
import { CreateAgentProfileDto, UpdateAgentProfileDto, SubmitAgentVerificationDto } from '../dto/agents.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agents')
@ApiBearerAuth('access-token')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Create profile' })
  async createProfile(@Request() req: any, @Body() createDto: CreateAgentProfileDto) {
    return this.agentsService.createProfile(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @Get('my-profile')
  @ApiOperation({ summary: 'Get my profile' })
  async getMyProfile(@Request() req: any) {
    return this.agentsService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @Patch('my-profile')
  @ApiOperation({ summary: 'Update my profile' })
  async updateMyProfile(@Request() req: any, @Body() updateDto: UpdateAgentProfileDto) {
    return this.agentsService.updateProfile(req.user.id, updateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  async getAllAgents() {
    return this.agentsService.getAllAgents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @Post('verify')
  @ApiOperation({ summary: 'Submit verification documents' })
  async submitVerification(@Request() req: any, @Body() dto: SubmitAgentVerificationDto) {
    return this.agentsService.submitVerification(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Approve or reject agent' })
  async verifyAgent(@Param('id') id: string, @Body('status') status: string) {
    return this.agentsService.verifyAgent(id, status);
  }
}
