import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionsService } from './inventory-transactions.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { DomainError } from '@/common/domain/error';
import { InventoryErrorCodes } from '../errors';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
  on: jest.fn(),
}));

describe('InventoryTransactionsService', () => {
  let service: InventoryTransactionsService;

  const mockPrismaService = {
    inventoryItem: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    inventoryTransaction: { create: jest.fn() },
    stockBalance: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(async (callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryTransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryTransactionsService>(InventoryTransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordTransaction', () => {
    const itemId = 'item-1';
    const userId = 'user-1';

    it('should throw ITEM_NOT_FOUND if item does not exist', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValueOnce(null);
      await expect(service.recordTransaction(itemId, userId, { type: 'IN', quantity: 10 })).rejects.toThrow(DomainError);
    });

    it('should throw INSUFFICIENT_STOCK if OUT transaction quantity exceeds current stock', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValueOnce({ id: itemId, quantity: 5 });
      await expect(service.recordTransaction(itemId, userId, { type: 'OUT', quantity: 10 })).rejects.toMatchObject({
        code: InventoryErrorCodes.INSUFFICIENT_STOCK,
      });
    });

    it('should update stock and emit low_stock event if stock falls below threshold', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValueOnce({ id: itemId, quantity: 20, minThreshold: 5 });
      
      // Update returns the item with the new quantity
      mockPrismaService.inventoryItem.update.mockResolvedValueOnce({ id: itemId, quantity: 4, minThreshold: 5 });
      mockPrismaService.inventoryTransaction.create.mockResolvedValueOnce({ id: 'tx-1' });

      await service.recordTransaction(itemId, userId, { type: 'OUT', quantity: 16 });

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { quantity: 4 },
      });
      expect(EventBus.emit).toHaveBeenCalledWith('inventory:low_stock', { itemId, currentQuantity: 4 }, 'InventoryTransactionsService');
    });

    it('should add stock for IN transactions', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValueOnce({ id: itemId, quantity: 10, minThreshold: 5 });
      mockPrismaService.inventoryItem.update.mockResolvedValueOnce({ id: itemId, quantity: 25, minThreshold: 5 });
      mockPrismaService.inventoryTransaction.create.mockResolvedValueOnce({ id: 'tx-1' });

      await service.recordTransaction(itemId, userId, { type: 'IN', quantity: 15 });

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { quantity: 25 }, // 10 + 15
      });
    });
  });
});
