import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from '../dto/rooms.dto';
import { DomainError } from '@/common/domain/error';
import { RoomErrorCodes } from '../errors';

@Injectable()
export class RoomsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(createRoomDto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: {
        roomTypeId_roomNumber: {
          roomTypeId: createRoomDto.roomTypeId,
          roomNumber: createRoomDto.roomNumber,
        },
      },
    });

    if (existing) {
      throw new DomainError(RoomErrorCodes.ROOM_NUMBER_EXISTS);
    }

    return await this.prisma.room.create({
      data: createRoomDto,
    });
  }

  async findAllByBranch(branchId: string) {
    return await this.prisma.room.findMany({
      where: {
        roomType: { branchId },
        ...this.commonQueries.notDeleted,
      },
      include: { roomType: true },
    });
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new DomainError(RoomErrorCodes.ROOM_NOT_FOUND);
    }

    return await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }
}
