import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentAuthorizationsService } from '../services/agent-authorizations.service';
import {
  RequestPropertyAuthorizationDto,
  ReviewAuthorizationRequestDto,
  InviteAgentDto,
} from '../dto/agents-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Agents - Authorizations & Portfolio')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentAuthorizationsController {
  constructor(private readonly authorizationsService: AgentAuthorizationsService) {}

  @Roles(Role.AGENT)
  @Post('authorizations/request')
  @ApiOperation({ summary: 'F-AG03: Agent requests authorization to represent property with pitch' })
  async requestAuthorization(
    @Request() req: any,
    @Body() dto: RequestPropertyAuthorizationDto,
  ) {
    return this.authorizationsService.requestAuthorization(req.user.id, dto);
  }

  @Roles(Role.AGENT)
  @Get('portfolio')
  @ApiOperation({ summary: 'F-AG05: Agent portfolio view (all authorized properties with performance metrics)' })
  async getAgentPortfolio(@Request() req: any) {
    return this.authorizationsService.getAgentPortfolio(req.user.id);
  }

  @Roles(Role.AGENT)
  @Get('portfolio/:propertyId/referral-link')
  @ApiOperation({ summary: 'F-AG06: Generate unique referral link and social share templates for property' })
  async generateReferralLink(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    return this.authorizationsService.generateReferralLink(req.user.id, propertyId);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Get('owner/properties/:propertyId/authorized-agents')
  @ApiOperation({ summary: 'F-AG04: Property owner views all authorized agents for their property' })
  async getPropertyAgents(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    return this.authorizationsService.getPropertyAgents(propertyId, req.user.id);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch('owner/authorizations/:id/review')
  @ApiOperation({ summary: 'F-AG04: Property owner approves or declines agent authorization request with commission rate' })
  async reviewAuthorization(
    @Request() req: any,
    @Param('id') authorizationId: string,
    @Body() dto: ReviewAuthorizationRequestDto,
  ) {
    return this.authorizationsService.reviewAuthorization(req.user.id, authorizationId, dto);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Patch('owner/authorizations/:id/revoke')
  @ApiOperation({ summary: 'F-AG04: Property owner revokes agent authorization' })
  async revokeAuthorization(
    @Request() req: any,
    @Param('id') authorizationId: string,
  ) {
    return this.authorizationsService.revokeAuthorization(req.user.id, authorizationId);
  }

  @Roles(Role.PROPERTY_OWNER, Role.HOTEL_OWNER)
  @Post('owner/invitations')
  @ApiOperation({ summary: 'F-AG04 & F-AG12: Property owner invites agent to represent listing' })
  async inviteAgent(@Request() req: any, @Body() dto: InviteAgentDto) {
    return this.authorizationsService.inviteAgent(req.user.id, dto);
  }
}
