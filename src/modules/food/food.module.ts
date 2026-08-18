import { Module } from '@nestjs/common';
import { FoodService } from './services/food.service';
import { FoodController } from './http/food.controller';

@Module({
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
