import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMessagesService } from './property-messages.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import EventBus from '@/common/events/event-bus';

jest.mock('@/common/events/event-bus', () => ({
  emit: jest.fn(),
}));

describe('PropertyMessagesService', () => {
  let service: PropertyMessagesService;
  let prisma: PrismaService;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    propertyBooking: {
      findUnique: jest.fn(),
    },
    propertyMessage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyMessagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyMessagesService>(PropertyMessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send message to owner', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      mockPrisma.propertyMessage.create.mockResolvedValue({ id: 'm1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'p1' });

      const result = await service.sendMessage('p1', 'guest1', { message: 'Hello' });
      expect(result.id).toBe('m1');
      expect(EventBus.emit).toHaveBeenCalledWith('property_message:received', expect.any(Object), 'PropertyMessagesService');
    });

    it('should throw if sender is receiver', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      await expect(service.sendMessage('p1', 'owner1', { message: 'Hello' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getThread', () => {
    it('should get thread and mark as read', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      mockPrisma.propertyMessage.findMany.mockResolvedValue([{ id: 'm1' }]);
      mockPrisma.propertyMessage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.getThread('p1', 'owner1', 'guest1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserConversations', () => {
    it('should return grouped conversations', async () => {
      mockPrisma.propertyMessage.findMany.mockResolvedValue([
        {
          id: 'm1', propertyId: 'p1', senderId: 'u1', receiverId: 'u2', message: 'Hello', createdAt: new Date(),
          property: { id: 'p1' }, sender: { id: 'u1' }, receiver: { id: 'u2' }
        }
      ]);

      const result = await service.getUserConversations('u1');
      expect(result).toHaveLength(1);
    });
  });
});
