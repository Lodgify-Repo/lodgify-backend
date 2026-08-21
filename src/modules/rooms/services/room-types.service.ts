import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto, CreatePricingRuleDto } from '../dto/rooms.dto';
import { DomainError } from '@/common/domain/error';
import { RoomErrorCodes } from '../errors';

@Injectable()
export class RoomTypesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(branchId: string, createRoomTypeDto: CreateRoomTypeDto) {
    return await this.prisma.roomType.create({
      data: {
        ...createRoomTypeDto,
        branchId,
      },
    });
  }

  async findAll(branchId: string) {
    return await this.prisma.roomType.findMany({
      where: { branchId },
      include: { pricingRules: true },
    });
  }

  async findOne(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: { pricingRules: true },
    });

    if (!roomType) {
      throw new DomainError(RoomErrorCodes.ROOM_TYPE_NOT_FOUND);
    }

    return roomType;
  }

  async update(id: string, updateRoomTypeDto: UpdateRoomTypeDto) {
    await this.findOne(id);
    return await this.prisma.roomType.update({
      where: { id },
      data: updateRoomTypeDto,
    });
  }

  async addPricingRule(roomTypeId: string, createPricingRuleDto: CreatePricingRuleDto) {
    await this.findOne(roomTypeId);
    return await this.prisma.pricingRule.create({
      data: {
        ...createPricingRuleDto,
        roomTypeId,
        startDate: new Date(createPricingRuleDto.startDate),
        endDate: new Date(createPricingRuleDto.endDate),
      },
    });
  }
}
