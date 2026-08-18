import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateInventoryItemDto {
  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  unit: string;

  @IsNumber()
  minThreshold: number;

  @IsOptional()
  @IsNumber()
  reorderQuantity?: number;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;
}

export class InventoryTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
