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

  @ApiPropertyOptional({ description: 'Barcode of the item' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Default supplier ID' })
  @IsOptional()
  @IsString()
  defaultSupplierId?: string;

  @ApiPropertyOptional({ description: 'Array of photo URLs' })
  @IsOptional()
  @IsString({ each: true })
  photos?: string[];

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

  @ApiPropertyOptional({ description: 'Storage location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Linked purchase order ID' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Linked room ID for consumption' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Linked food order ID for consumption' })
  @IsOptional()
  @IsString()
  foodOrderId?: string;

  @ApiPropertyOptional({ description: 'Linked maintenance task ID for consumption' })
  @IsOptional()
  @IsString()
  maintenanceId?: string;
}
