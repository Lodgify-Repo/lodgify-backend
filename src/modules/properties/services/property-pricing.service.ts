import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreatePropertyPricingRuleDto } from '../dto/properties-extended.dto';

@Injectable()
export class PropertyPricingService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // F-P02: Create/Add Dynamic Pricing Rule
  async createPricingRule(propertyId: string, ownerId: string, dto: CreatePropertyPricingRuleDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.propertyPricingRule.create({
      data: {
        propertyId,
        name: dto.name,
        type: dto.type,
        modifierType: dto.modifierType,
        modifierValue: dto.modifierValue,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // F-P02: List Pricing Rules for Property
  async getPricingRules(propertyId: string) {
    return await this.prisma.propertyPricingRule.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // F-P02: Deactivate / Delete Pricing Rule
  async deletePricingRule(ruleId: string, ownerId: string) {
    const rule = await this.prisma.propertyPricingRule.findUnique({
      where: { id: ruleId },
      include: { property: true },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    if (rule.property.ownerId !== ownerId) throw new BadRequestException('Unauthorized');

    return await this.prisma.propertyPricingRule.delete({ where: { id: ruleId } });
  }

  // F-P02: Calculate nightly price breakdown for date range
  async calculateNightlyBreakdown(propertyId: string, checkInDate: Date, checkOutDate: Date) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { pricingRules: { where: { isActive: true } } },
    });

    if (!property) throw new NotFoundException('Property not found');

    const baseNightlyRate = property.nightlyRate || property.price;
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) throw new BadRequestException('Check-out must be after check-in');

    const dailyRates: { date: string; baseRate: number; effectiveRate: number; appliedRule?: string }[] = [];
    let totalBase = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      const isWeekend = currentDate.getDay() === 5 || currentDate.getDay() === 6; // Friday / Saturday

      let effectiveRate = baseNightlyRate;
      let appliedRuleName: string | undefined;

      // Check seasonal/custom date rules
      const matchingDateRule = property.pricingRules.find(r =>
        r.startDate && r.endDate && currentDate >= r.startDate && currentDate <= r.endDate
      );

      // Check weekend rule
      const weekendRule = property.pricingRules.find(r => r.type === 'WEEKEND');

      if (matchingDateRule) {
        appliedRuleName = matchingDateRule.name;
        if (matchingDateRule.modifierType === 'PERCENTAGE') {
          effectiveRate = baseNightlyRate * (1 + matchingDateRule.modifierValue / 100);
        } else if (matchingDateRule.modifierType === 'FIXED_AMOUNT') {
          effectiveRate = baseNightlyRate + matchingDateRule.modifierValue;
        } else if (matchingDateRule.modifierType === 'NIGHTLY_RATE') {
          effectiveRate = matchingDateRule.modifierValue;
        }
      } else if (isWeekend && weekendRule) {
        appliedRuleName = weekendRule.name;
        if (weekendRule.modifierType === 'PERCENTAGE') {
          effectiveRate = baseNightlyRate * (1 + weekendRule.modifierValue / 100);
        } else if (weekendRule.modifierType === 'FIXED_AMOUNT') {
          effectiveRate = baseNightlyRate + weekendRule.modifierValue;
        }
      }

      totalBase += effectiveRate;
      dailyRates.push({
        date: currentDate.toISOString().split('T')[0],
        baseRate: baseNightlyRate,
        effectiveRate,
        appliedRule: appliedRuleName,
      });
    }

    return {
      nights,
      baseNightlyRate,
      averageNightlyRate: parseFloat((totalBase / nights).toFixed(2)),
      totalBaseAmount: totalBase,
      dailyRates,
    };
  }
}
