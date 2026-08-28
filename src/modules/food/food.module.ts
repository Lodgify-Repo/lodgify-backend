import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';

// Services
import { MenuCategoriesService } from './services/menu-categories.service';
import { MenuItemsService } from './services/menu-items.service';
import { GuestMenuService } from './services/guest-menu.service';
import { FoodOrdersService } from './services/food-orders.service';
import { KitchenService } from './services/kitchen.service';
import { DailySpecialsService } from './services/daily-specials.service';
import { MenuRecipesService } from './services/menu-recipes.service';
import { OrderHistoryService } from './services/order-history.service';

// Controllers
import { MenuCategoriesController } from './http/menu-categories.controller';
import { MenuItemsController } from './http/menu-items.controller';
import { GuestMenuController } from './http/guest-menu.controller';
import { FoodOrdersController } from './http/food-orders.controller';
import { KitchenController } from './http/kitchen.controller';
import { DailySpecialsController } from './http/daily-specials.controller';
import { MenuRecipesController } from './http/menu-recipes.controller';
import { OrderHistoryController } from './http/order-history.controller';

@Module({
  imports: [InventoryModule],
  controllers: [
    MenuCategoriesController,
    MenuItemsController,
    GuestMenuController,
    FoodOrdersController,
    KitchenController,
    DailySpecialsController,
    MenuRecipesController,
    OrderHistoryController,
  ],
  providers: [
    MenuCategoriesService,
    MenuItemsService,
    GuestMenuService,
    FoodOrdersService,
    KitchenService,
    DailySpecialsService,
    MenuRecipesService,
    OrderHistoryService,
  ],
  exports: [FoodOrdersService, MenuRecipesService],
})
export class FoodModule {}
