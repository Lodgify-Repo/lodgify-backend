import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateHotelDto, UpdateHotelDto } from '../dto/hotels.dto';
import { DomainError } from '@/common/domain/error';
import { HotelErrorCodes } from '../errors';

@Injectable()
export class HotelsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(ownerId: string, createHotelDto: CreateHotelDto) {
    const existing = await this.prisma.hotel.findUnique({
      where: { ownerId },
    });

    if (existing) {
      throw new DomainError(HotelErrorCodes.HOTEL_ALREADY_EXISTS, 'User already owns a hotel');
    }

    return await this.prisma.hotel.create({
      data: {
        ...createHotelDto,
        ownerId,
      },
    });
  }

  async findByOwner(ownerId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: true },
    });

    if (!hotel) {
      throw new DomainError(HotelErrorCodes.HOTEL_NOT_FOUND);
    }

    return hotel;
  }

  async update(ownerId: string, updateHotelDto: UpdateHotelDto) {
    const hotel = await this.findByOwner(ownerId);
    return await this.prisma.hotel.update({
      where: { id: hotel.id },
      data: updateHotelDto,
    });
  }
}
