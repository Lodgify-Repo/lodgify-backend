import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { UpdateUserStatusDto, VerifyAgentDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  async updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('agents/pending')
  async getPendingAgents() {
    return this.adminService.getPendingAgents();
  }

  @Patch('agents/:id/verify')
  async verifyAgent(@Param('id') id: string, @Body() dto: VerifyAgentDto) {
    return this.adminService.verifyAgent(id, dto);
  }

  @Get('logs')
  async getSystemLogs() {
    return this.adminService.getSystemLogs();
  }
}
