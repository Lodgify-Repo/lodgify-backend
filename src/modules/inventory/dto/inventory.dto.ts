import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Inventory category ID', example: 'clxyz123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Item name', example: 'Bed Sheets (King)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Stock Keeping Unit identifier', example: 'SKU-SHEET-K001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'Unit of measurement', example: 'pieces' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Minimum stock threshold before alert', example: 10 })
  @IsNumber()
  minThreshold: number;

  @ApiPropertyOptional({ description: 'Default reorder quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Cost per unit in base currency', example: 2500 })
  @IsOptional()
  @IsNumber()
  costPerUnit?: number;
}

export class InventoryTransactionDto {
  @ApiProperty({ description: 'Transaction type', enum: ['IN', 'OUT', 'ADJUSTMENT'] })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Quantity to transact', example: 25 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Remarks or reason', example: 'Monthly restock from supplier' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
