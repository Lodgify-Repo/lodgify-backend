import { Module } from '@nestjs/common';
import { HotelsService } from './services/hotels.service';
import { BranchesService } from './services/branches.service';
import { HotelsController } from './http/hotels.controller';
import { BranchesController } from './http/branches.controller';

@Module({
  controllers: [HotelsController, BranchesController],
  providers: [HotelsService, BranchesService],
  exports: [HotelsService, BranchesService],
})
export class HotelsModule {}
