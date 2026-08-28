import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentLeadsService } from '../services/agent-leads.service';
import {
  CreateLeadDto,
  UpdateLeadStatusDto,
  ScheduleViewingDto,
  ReviewViewingDto,
} from '../dto/agents-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agents - Leads & Viewings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentLeadsController {
  constructor(private readonly leadsService: AgentLeadsService) {}

  @Roles(Role.AGENT)
  @Post('leads')
  @ApiOperation({ summary: 'F-AG07: Create new lead in agent CRM pipeline' })
  async createLead(@Request() req: any, @Body() dto: CreateLeadDto) {
    return this.leadsService.createLead(req.user.id, dto);
  }

  @Roles(Role.AGENT)
  @Get('leads')
  @ApiOperation({ summary: 'F-AG07: Get agent leads pipeline with stage summaries (New, Contacted, Viewing, etc.)' })
  @ApiQuery({ name: 'status', required: false })
  async getAgentLeads(@Request() req: any, @Query('status') status?: string) {
    return this.leadsService.getAgentLeads(req.user.id, status);
  }

  @Roles(Role.AGENT)
  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'F-AG07: Advance or update lead stage in pipeline' })
  async updateLeadStatus(
    @Request() req: any,
    @Param('id') leadId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateLeadStatus(req.user.id, leadId, dto);
  }

  @Roles(Role.AGENT)
  @Post('viewings/schedule')
  @ApiOperation({ summary: 'F-AG08: Schedule property viewing on behalf of client prospect' })
  async scheduleViewing(@Request() req: any, @Body() dto: ScheduleViewingDto) {
    return this.leadsService.scheduleViewing(req.user.id, dto);
  }

  @Roles(Role.AGENT)
  @Get('viewings')
  @ApiOperation({ summary: 'F-AG08: Get agent scheduled viewings list' })
  async getAgentViewings(@Request() req: any) {
    return this.leadsService.getAgentViewings(req.user.id);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER, Role.AGENT)
  @Patch('viewings/:id/review')
  @ApiOperation({ summary: 'F-AG08: Confirm, reschedule, or complete viewing appointment' })
  async reviewViewing(
    @Param('id') viewingId: string,
    @Body() dto: ReviewViewingDto,
  ) {
    return this.leadsService.reviewViewing(viewingId, dto);
  }
}
