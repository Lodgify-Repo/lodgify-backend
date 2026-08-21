import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from '../dto/hotels.dto';
import { DomainError } from '@/common/domain/error';
import { HotelErrorCodes } from '../errors';

@Injectable()
export class BranchesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(hotelId: string, createBranchDto: CreateBranchDto) {
    return await this.prisma.branch.create({
      data: {
        ...createBranchDto,
        hotelId,
      },
    });
  }

  async findAll(hotelId: string) {
    return await this.prisma.branch.findMany({
      where: { hotelId },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new DomainError(HotelErrorCodes.BRANCH_NOT_FOUND);
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id); // Check existence
    return await this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'OFFLINE' },
    });
    return { success: true };
  }
}
