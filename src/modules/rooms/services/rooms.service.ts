import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, CreateRoomMaintenanceDto } from '../dto/rooms.dto';
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

  async updateStatus(id: string, updateStatusDto: UpdateRoomStatusDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new DomainError(RoomErrorCodes.ROOM_NOT_FOUND);
    }

    return await this.prisma.room.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }

  async scheduleMaintenance(id: string, dto: CreateRoomMaintenanceDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new DomainError(RoomErrorCodes.ROOM_NOT_FOUND);
    }

    return await this.prisma.roomMaintenance.create({
      data: {
        roomId: id,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });
  }

  async getRoomMaintenance(roomId: string) {
    return await this.prisma.roomMaintenance.findMany({
      where: { roomId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getAvailabilityCalendar(branchId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rooms = await this.prisma.room.findMany({
      where: { roomType: { branchId } },
      include: {
        roomType: true,
        bookings: {
          where: {
            checkInDate: { lt: end },
            checkOutDate: { gt: start },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        },
        maintenanceBlocks: {
          where: {
            startDate: { lt: end },
            endDate: { gt: start },
            status: { notIn: ['CANCELLED'] },
          },
        },
      },
    });

    return rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      roomTypeName: room.roomType.name,
      currentStatus: room.status,
      bookings: room.bookings.map(b => ({
        id: b.id,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
      })),
      maintenanceBlocks: room.maintenanceBlocks.map(m => ({
        id: m.id,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        reason: m.reason,
      })),
    }));
  }
}
