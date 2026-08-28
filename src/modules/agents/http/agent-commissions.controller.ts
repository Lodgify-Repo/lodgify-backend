import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentCommissionsService } from '../services/agent-commissions.service';
import { InitiateCommissionPayoutDto } from '../dto/agents-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agents - Commissions & Analytics')
@Controller('agents')
export class AgentCommissionsController {
  constructor(private readonly commissionsService: AgentCommissionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Get('commissions')
  @ApiOperation({ summary: 'F-AG09: Get agent commission tracking & financial earnings summary' })
  async getAgentCommissions(@Request() req: any) {
    return this.commissionsService.getAgentCommissions(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Get('commissions/statement')
  @ApiOperation({ summary: 'F-AG10: Downloadable / structured financial commission statement' })
  async getCommissionStatement(@Request() req: any) {
    return this.commissionsService.getCommissionStatement(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @ApiBearerAuth('access-token')
  @Post('owner/commissions/payout')
  @ApiOperation({ summary: 'F-AG10: Property owner initiates commission payout via Paystack / Bank Transfer' })
  async initiatePayout(@Request() req: any, @Body() dto: InitiateCommissionPayoutDto) {
    return this.commissionsService.initiatePayout(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT)
  @ApiBearerAuth('access-token')
  @Get('analytics/performance')
  @ApiOperation({ summary: 'F-AG11: Agent performance analytics dashboard (leads, conversions, commissions, ranking)' })
  async getAgentAnalytics(@Request() req: any) {
    return this.commissionsService.getAgentAnalytics(req.user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'F-AG11: Public/Agent Top Performer Leaderboard' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.commissionsService.getLeaderboard(limit ? parseInt(limit) : 10);
  }
}
