import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/properties.dto';
import { DomainError } from '@/common/domain/error';
import { PropertyErrorCodes } from '../errors';

@Injectable()
export class PropertiesService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(createPropertyDto: CreatePropertyDto) {
    const { images, ...data } = createPropertyDto;

    return await this.prisma.property.create({
      data: {
        ...data,
        images: images ? {
          create: images.map(url => ({ url }))
        } : undefined,
      },
      include: { images: true },
    });
  }

  async findAll() {
    return await this.prisma.property.findMany({
      include: { images: true },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      throw new DomainError(PropertyErrorCodes.PROPERTY_NOT_FOUND);
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    await this.findOne(id);
    const { images, ...data } = updatePropertyDto;

    return await this.prisma.property.update({
      where: { id },
      data: {
        ...data,
        // For simplicity, we are not updating images here.
        // A robust implementation would handle adding/removing images separately.
      },
    });
  }
}
