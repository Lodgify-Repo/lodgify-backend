import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { UpdateUserStatusDto, VerifyAgentDto } from '../dto/admin.dto';
import { SystemLogsQueryDto, ClearLogsDto } from '../dto/system-logs.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('agents/pending')
  @ApiOperation({ summary: 'Get pending agents' })
  async getPendingAgents() {
    return this.adminService.getPendingAgents();
  }

  @Patch('agents/:id/verify')
  @ApiOperation({ summary: 'Verify agent' })
  async verifyAgent(@Param('id') id: string, @Body() dto: VerifyAgentDto) {
    return this.adminService.verifyAgent(id, dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get system logs' })
  async getSystemLogs(@Query() dto: SystemLogsQueryDto) {
    return this.adminService.getSystemLogs(dto);
  }

  @Delete('logs')
  @ApiOperation({ summary: 'Clear audit logs' })
  async clearAuditLogs(@Body() dto: ClearLogsDto) {
    return this.adminService.clearAuditLogs(dto);
  }
}

