import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Query } from '@nestjs/common';
import { MenuRecipesService } from '../services/menu-recipes.service';
import { SetMenuItemRecipeDto } from '../dto/food-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Food - Menu Recipes (Inventory Link)')
@ApiBearerAuth('access-token')
@Controller('branches/:branchId/food/menu/:menuItemId/recipe')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuRecipesController {
  constructor(private readonly recipesService: MenuRecipesService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-F09: Set recipe (link ingredients to menu item)' })
  async setRecipe(@Param('menuItemId') menuItemId: string, @Body() dto: SetMenuItemRecipeDto) {
    return this.recipesService.setRecipe(menuItemId, dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER, Role.RESTAURANT_STAFF)
  @Get()
  @ApiOperation({ summary: 'F-F09: Get recipe for a menu item' })
  async getRecipe(@Param('menuItemId') menuItemId: string) {
    return this.recipesService.getRecipe(menuItemId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER, Role.RESTAURANT_STAFF)
  @Get('availability')
  @ApiOperation({ summary: 'F-F09: Check ingredient availability' })
  async checkAvailability(@Param('menuItemId') menuItemId: string, @Query('quantity') quantity?: string) {
    return this.recipesService.checkAvailability(menuItemId, quantity ? parseInt(quantity) : 1);
  }
}
