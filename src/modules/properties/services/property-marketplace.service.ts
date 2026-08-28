import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { PropertyMarketplaceQueryDto } from '../dto/properties-extended.dto';
import { Prisma } from '@prisma/client';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) dist = 1;
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist * 1.609344; // kilometers
}

@Injectable()
export class PropertyMarketplaceService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P04: Property Marketplace Search with rich filters
  async searchMarketplace(dto: PropertyMarketplaceQueryDto) {
    const {
      query,
      type,
      listingType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      petFriendly,
      furnished,
      amenities,
      latitude,
      longitude,
      radius = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
      deletedAt: null,
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (bedrooms !== undefined) where.bedrooms = { gte: bedrooms };
    if (bathrooms !== undefined) where.bathrooms = { gte: bathrooms };
    if (petFriendly !== undefined) where.petFriendly = petFriendly;
    if (furnished !== undefined) where.furnished = furnished;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : typeof amenities === 'string'
        ? amenities.split(',').map(a => a.trim())
        : [];
      if (amenitiesList.length > 0) {
        where.amenities = { hasEvery: amenitiesList };
      }
    }

    const needsGeoProcessing = latitude !== undefined && longitude !== undefined;
    const isDistanceSort = sortBy === 'distance' && needsGeoProcessing;

    let orderBy: Prisma.PropertyOrderByWithRelationInput | undefined;
    if (!isDistanceSort) {
      if (sortBy === 'price') orderBy = { price: sortOrder };
      else if (sortBy === 'rating') orderBy = { rating: sortOrder };
      else orderBy = { createdAt: sortOrder };
    }

    const properties = await this.prisma.property.findMany({
      where,
      ...(needsGeoProcessing ? {} : { skip: (page - 1) * limit, take: limit }),
      ...(orderBy ? { orderBy } : {}),
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 5 },
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    let enriched = properties.map(p => {
      const distance = needsGeoProcessing
        ? calculateDistance(latitude as number, longitude as number, p.latitude || 0, p.longitude || 0)
        : undefined;
      return {
        id: p.id,
        title: p.title,
        type: p.type,
        listingType: p.listingType,
        price: p.price,
        nightlyRate: p.nightlyRate,
        monthlyRate: p.monthlyRate,
        currency: p.currency,
        address: p.address,
        city: p.city,
        state: p.state,
        latitude: p.latitude,
        longitude: p.longitude,
        distance: distance !== undefined ? parseFloat(distance.toFixed(1)) : undefined,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        petFriendly: p.petFriendly,
        furnished: p.furnished,
        amenities: p.amenities,
        instantBookable: p.instantBookable,
        isOwnerVerified: p.isOwnerVerified,
        isPhotoVerified: p.isPhotoVerified,
        rating: p.rating,
        reviewCount: p.reviewCount,
        images: p.images.map(img => img.url),
        primaryImage: p.images[0]?.url || null,
        createdAt: p.createdAt,
      };
    });

    let total = needsGeoProcessing ? 0 : await this.prisma.property.count({ where });

    if (needsGeoProcessing) {
      if (radius !== undefined) {
        enriched = enriched.filter(p => p.distance !== undefined && p.distance <= radius);
      }
      if (isDistanceSort) {
        enriched.sort((a, b) => {
          const d1 = a.distance ?? Infinity;
          const d2 = b.distance ?? Infinity;
          return sortOrder === 'asc' ? d1 - d2 : d2 - d1;
        });
      }
      total = enriched.length;
      enriched = enriched.slice((page - 1) * limit, page * limit);
    }

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // F-P04: Map View with Price Pins
  async getMapPins(dto: { latitude?: number; longitude?: number; radius?: number; type?: string; listingType?: string }) {
    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (dto.type) where.type = dto.type;
    if (dto.listingType) where.listingType = dto.listingType;

    const properties = await this.prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        listingType: true,
        price: true,
        nightlyRate: true,
        currency: true,
        latitude: true,
        longitude: true,
        rating: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });

    let pins = properties.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      listingType: p.listingType,
      displayPrice: p.nightlyRate || p.price,
      currency: p.currency,
      latitude: p.latitude!,
      longitude: p.longitude!,
      rating: p.rating,
      thumbnail: p.images[0]?.url || null,
      distance: dto.latitude && dto.longitude
        ? parseFloat(calculateDistance(dto.latitude, dto.longitude, p.latitude!, p.longitude!).toFixed(1))
        : undefined,
    }));

    if (dto.latitude && dto.longitude && dto.radius) {
      pins = pins.filter(p => p.distance !== undefined && p.distance <= dto.radius!);
    }

    return { total: pins.length, pins };
  }

  // F-P12: Similar Properties Algorithm
  async getSimilarProperties(propertyId: string, limit: number = 4) {
    const target = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!target) throw new NotFoundException('Property not found');

    const minPrice = target.price * 0.7; // -30%
    const maxPrice = target.price * 1.3; // +30%

    // Candidates in same city or same state with same listing type
    const candidates = await this.prisma.property.findMany({
      where: {
        id: { not: propertyId },
        status: 'AVAILABLE',
        deletedAt: null,
        listingType: target.listingType,
        OR: [
          { city: { equals: target.city, mode: 'insensitive' } },
          { state: { equals: target.state, mode: 'insensitive' } },
          { type: target.type },
        ],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 20,
    });

    // Score similarity
    const scored = candidates.map(candidate => {
      let score = 0;

      // Location match (+40 city, +20 state)
      if (candidate.city.toLowerCase() === target.city.toLowerCase()) score += 40;
      else if (candidate.state.toLowerCase() === target.state.toLowerCase()) score += 20;

      // Property type match (+25)
      if (candidate.type === target.type) score += 25;

      // Price proximity (+20 if within 30%)
      if (candidate.price >= minPrice && candidate.price <= maxPrice) {
        score += 20;
      }

      // Shared amenities overlap (+15)
      const targetAmenities = new Set(target.amenities);
      const sharedCount = candidate.amenities.filter(a => targetAmenities.has(a)).length;
      if (sharedCount > 0) {
        score += Math.min(15, sharedCount * 3);
      }

      return {
        id: candidate.id,
        title: candidate.title,
        type: candidate.type,
        listingType: candidate.listingType,
        price: candidate.price,
        nightlyRate: candidate.nightlyRate,
        city: candidate.city,
        state: candidate.state,
        bedrooms: candidate.bedrooms,
        bathrooms: candidate.bathrooms,
        rating: candidate.rating,
        thumbnail: candidate.images[0]?.url || null,
        similarityScore: score,
      };
    });

    // Sort by similarity score descending
    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    return scored.slice(0, limit);
  }
}
