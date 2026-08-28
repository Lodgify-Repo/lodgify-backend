import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { AgentsService } from '../services/agents.service';
import {
  CreateAgentProfileExtendedDto,
  UpdateAgentProfileExtendedDto,
  SubmitAgentVerificationDto,
  VerifyAgentDto,
  AgentDirectoryQueryDto,
  CreateAgentReviewDto,
} from '../dto/agents-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agents - Profile & Directory')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('profile')
  @ApiOperation({ summary: 'F-AG01: Create agent profile (Individual or Company with license, bio, specializations)' })
  async createProfile(@Request() req: any, @Body() createDto: CreateAgentProfileExtendedDto) {
    return this.agentsService.createProfile(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Get('my-profile')
  @ApiOperation({ summary: 'F-AG01: Get my agent profile' })
  async getMyProfile(@Request() req: any) {
    return this.agentsService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Patch('my-profile')
  @ApiOperation({ summary: 'F-AG01: Update my agent profile details' })
  async updateMyProfile(@Request() req: any, @Body() updateDto: UpdateAgentProfileExtendedDto) {
    return this.agentsService.updateProfile(req.user.id, updateDto);
  }

  @Get('directory')
  @ApiOperation({ summary: 'F-AG12: Search public agent directory with filters (specialization, area, account type, rating)' })
  async getAgentDirectory(@Query() queryDto: AgentDirectoryQueryDto) {
    return this.agentsService.getAgentDirectory(queryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all verified agents (simple list)' })
  async getAllAgents() {
    return this.agentsService.getAllAgents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Post('verify')
  @ApiOperation({ summary: 'F-AG02: Submit agent license, CAC registration, and ID documents for verification' })
  async submitVerification(@Request() req: any, @Body() dto: SubmitAgentVerificationDto) {
    return this.agentsService.submitVerification(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @Patch(':id/verify')
  @ApiOperation({ summary: 'F-AG02: Admin approves or rejects agent verification with verified badge & tier' })
  async verifyAgent(@Param('id') id: string, @Body() dto: VerifyAgentDto) {
    return this.agentsService.verifyAgent(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post(':id/reviews')
  @ApiOperation({ summary: 'F-AG12: Submit client review for an agent (professionalism, market knowledge, responsiveness)' })
  async createAgentReview(
    @Request() req: any,
    @Param('id') agentId: string,
    @Body() dto: CreateAgentReviewDto,
  ) {
    return this.agentsService.createAgentReview(agentId, req.user.id, dto);
  }
}
