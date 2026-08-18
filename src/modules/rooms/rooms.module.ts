import { Module } from '@nestjs/common';
import { RoomTypesService } from './services/room-types.service';
import { RoomsService } from './services/rooms.service';
import { RoomTypesController } from './http/room-types.controller';
import { RoomsController } from './http/rooms.controller';

@Module({
  controllers: [RoomTypesController, RoomsController],
  providers: [RoomTypesService, RoomsService],
  exports: [RoomTypesService, RoomsService],
})
export class RoomsModule {}
