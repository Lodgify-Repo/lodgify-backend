import { Module } from '@nestjs/common';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './http/inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
