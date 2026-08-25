import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Body, UseGuards, Request, Patch, Delete, Post, Param } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { InviteSubAccountDto } from '../dto/sub-account.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOTEL_OWNER, Role.PROPERTY_OWNER)
  @Post('sub-accounts/invite')
  @ApiOperation({ summary: 'Invite staff sub-account' })
  async inviteSubAccount(@Request() req: any, @Body() dto: InviteSubAccountDto) {
    return this.usersService.inviteSubAccount(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOTEL_OWNER, Role.PROPERTY_OWNER)
  @Get('sub-accounts')
  @ApiOperation({ summary: 'List sub-accounts' })
  async getSubAccounts(@Request() req: any) {
    return this.usersService.getSubAccounts(req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOTEL_OWNER, Role.PROPERTY_OWNER)
  @Patch('sub-accounts/:id/status')
  @ApiOperation({ summary: 'Activate/deactivate sub-account' })
  async setSubAccountStatus(@Request() req: any, @Param('id') subAccountId: string, @Body('isActive') isActive: boolean) {
    return this.usersService.setSubAccountStatus(req.user.id, subAccountId, isActive);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOTEL_OWNER, Role.PROPERTY_OWNER)
  @Delete('sub-accounts/:id')
  @ApiOperation({ summary: 'Remove sub-account from organization' })
  async removeSubAccount(@Request() req: any, @Param('id') subAccountId: string) {
    return this.usersService.removeSubAccount(req.user.id, subAccountId);
  }
}
