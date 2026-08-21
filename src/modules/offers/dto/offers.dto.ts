import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ description: 'Property ID to make an offer on', example: 'clxyz789' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Offer amount', example: 42000000 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Message to the property owner', example: 'Very interested, can we negotiate?' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateOfferStatusDto {
  @ApiProperty({ description: 'Offer response status', enum: ['ACCEPTED', 'REJECTED'] })
  @IsEnum(['ACCEPTED', 'REJECTED'])
  status: 'ACCEPTED' | 'REJECTED';
}
