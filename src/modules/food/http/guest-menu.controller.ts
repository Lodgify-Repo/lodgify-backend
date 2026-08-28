import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Put, Body, UseGuards, Param, Query, Request } from '@nestjs/common';
import { GuestMenuService } from '../services/guest-menu.service';
import { UpdateDietaryPreferencesDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Guest Menu')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/guest-menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuestMenuController {
  constructor(private readonly guestMenuService: GuestMenuService) {}

  @Roles(Role.TRAVELER, Role.FRONT_DESK, Role.RESTAURANT_STAFF)
  @Get()
  @ApiOperation({ summary: 'F-F03: Browse menu with filters and dietary personalization' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'dietaryTag', required: false })
  @ApiQuery({ name: 'search', required: false })
  async browseMenu(
    @Request() req: any,
    @Param('branchId') branchId: string,
    @Query('categoryId') categoryId?: string,
    @Query('dietaryTag') dietaryTag?: string,
    @Query('search') search?: string,
  ) {
    return this.guestMenuService.browseMenu(branchId, { categoryId, dietaryTag, search }, req.user?.id);
  }

  @Roles(Role.TRAVELER)
  @Get('dietary-preferences')
  @ApiOperation({ summary: 'F-F12: Get guest dietary preferences' })
  async getDietaryPreferences(@Request() req: any) {
    return this.guestMenuService.getDietaryPreferences(req.user.id);
  }

  @Roles(Role.TRAVELER)
  @Put('dietary-preferences')
  @ApiOperation({ summary: 'F-F12: Update guest dietary preferences' })
  async updateDietaryPreferences(@Request() req: any, @Body() dto: UpdateDietaryPreferencesDto) {
    return this.guestMenuService.updateDietaryPreferences(
      req.user.id,
      dto.dietaryPreferences || [],
      dto.allergyNotes,
    );
  }
}
