import { Controller, Get, Body, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Delete('me')
  async deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }
}
