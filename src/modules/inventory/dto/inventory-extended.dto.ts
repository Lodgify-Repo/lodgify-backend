import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// -----------------------------------------
// F-I01 Categories
// -----------------------------------------
export class CreateInventoryCategoryDto {
  @ApiProperty({ example: 'Toiletries' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// -----------------------------------------
// F-I03 Storage Locations
// -----------------------------------------
export class CreateStorageLocationDto {
  @ApiProperty({ example: 'Main Storage' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MAIN_STORAGE', enum: ['MAIN_STORAGE', 'FLOOR_PANTRY', 'KITCHEN'] })
  @IsString()
  type: string;
}

// -----------------------------------------
// F-I06 Alert Config
// -----------------------------------------
export class UpdateAlertConfigDto {
  @ApiProperty({ example: ['admin@hotel.com'] })
  @IsArray()
  @IsString({ each: true })
  emailRecipients: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  notifyInApp: boolean;
}

// -----------------------------------------
// F-I07 Stock Transfers
// -----------------------------------------
export class TransferItemDto {
  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;
}

export class CreateStockTransferDto {
  @ApiProperty({ example: 'to-branch-uuid' })
  @IsString()
  toBranchId: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  items: TransferItemDto[];
}

export class UpdateTransferStatusDto {
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED'] })
  @IsString()
  status: string;
}

// -----------------------------------------
// F-I08 Purchase Orders
// -----------------------------------------
export class POItemDto {
  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'supplier-uuid' })
  @IsString()
  supplierId: string;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiProperty({ type: [POItemDto] })
  @IsArray()
  items: POItemDto[];
}

export class UpdatePOStatusDto {
  @ApiProperty({ enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'FULFILLED', 'CANCELLED'] })
  @IsString()
  status: string;
}

// -----------------------------------------
// F-I09 Suppliers
// -----------------------------------------
export class CreateSupplierDto {
  @ApiProperty({ example: 'Global Supplies Inc.' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: ['Toiletries', 'Linens'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suppliedItems?: string[];
}

export class RateSupplierDto {
  @ApiProperty({ example: 5, description: '1-5 stars overall' })
  @IsNumber()
  rating: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  deliveryRating?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  qualityRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

// -----------------------------------------
// F-I10 Stock Counts
// -----------------------------------------
export class InitiateStockCountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordCountItemDto {
  @ApiProperty({ example: 48.5 })
  @IsNumber()
  actualQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResolveVarianceDto {
  @ApiProperty({ enum: ['AUTO_ADJUST', 'FLAG_FOR_REVIEW'] })
  @IsString()
  action: string;
}

// -----------------------------------------
// F-I12 Room Inventory Link
// -----------------------------------------
export class CreateRoomInventoryLinkDto {
  @ApiProperty({ example: 'room-type-uuid' })
  @IsString()
  roomTypeId: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantityPerClean: number;
}
