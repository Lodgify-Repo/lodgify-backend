import { Module } from '@nestjs/common';

import { CategoriesService } from './services/categories.service';
import { InventoryItemsService } from './services/inventory-items.service';
import { InventoryTransactionsService } from './services/inventory-transactions.service';
import { LowStockAlertsService } from './services/low-stock-alerts.service';
import { StockTransfersService } from './services/stock-transfers.service';
import { PurchaseOrdersService } from './services/purchase-orders.service';
import { SuppliersService } from './services/suppliers.service';
import { StockCountsService } from './services/stock-counts.service';
import { InventoryAnalyticsService } from './services/inventory-analytics.service';
import { RoomInventoryLinksService } from './services/room-inventory-links.service';

import { CategoriesController } from './http/categories.controller';
import { InventoryItemsController } from './http/inventory-items.controller';
import { InventoryTransactionsController } from './http/inventory-transactions.controller';
import { LowStockAlertsController } from './http/low-stock-alerts.controller';
import { StockTransfersController } from './http/stock-transfers.controller';
import { PurchaseOrdersController } from './http/purchase-orders.controller';
import { SuppliersController } from './http/suppliers.controller';
import { StockCountsController } from './http/stock-counts.controller';
import { InventoryAnalyticsController } from './http/inventory-analytics.controller';
import { RoomInventoryLinksController } from './http/room-inventory-links.controller';

import { InventoryListeners } from './listeners/inventory.listeners';

@Module({
  controllers: [
    CategoriesController,
    InventoryItemsController,
    InventoryTransactionsController,
    LowStockAlertsController,
    StockTransfersController,
    PurchaseOrdersController,
    SuppliersController,
    StockCountsController,
    InventoryAnalyticsController,
    RoomInventoryLinksController,
  ],
  providers: [
    CategoriesService,
    InventoryItemsService,
    InventoryTransactionsService,
    LowStockAlertsService,
    StockTransfersService,
    PurchaseOrdersService,
    SuppliersService,
    StockCountsService,
    InventoryAnalyticsService,
    RoomInventoryLinksService,
    InventoryListeners,
  ],
  exports: [
    InventoryItemsService,
    InventoryTransactionsService,
  ],
})
export class InventoryModule {}
