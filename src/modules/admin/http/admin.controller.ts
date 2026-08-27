import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { UpdateUserStatusDto, VerifyAgentDto, VerifyHotelDto } from '../dto/admin.dto';
import { SystemLogsQueryDto, ClearLogsDto } from '../dto/system-logs.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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

  // ---------------------------------------------------------
  // Hotel Verification (F-H04)
  // ---------------------------------------------------------

  @Get('hotels/pending')
  @ApiOperation({ summary: 'List hotels awaiting verification (F-H04)' })
  async getPendingHotels() {
    return this.adminService.getPendingHotels();
  }

  @Get('hotels/:id')
  @ApiOperation({ summary: 'Review hotel details — documents, owner info, branches (F-H04)' })
  async getHotelForReview(@Param('id') id: string) {
    return this.adminService.getHotelForReview(id);
  }

  @Patch('hotels/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a hotel registration (F-H04)' })
  async verifyHotel(@Param('id') id: string, @Body() dto: VerifyHotelDto, @Request() req: any) {
    return this.adminService.verifyHotel(id, dto, req.user.id);
  }

  // ---------------------------------------------------------
  // System Logs
  // ---------------------------------------------------------

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
