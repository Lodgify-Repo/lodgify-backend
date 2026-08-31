import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMessagesController } from './property-messages.controller';
import { PropertyMessagesService } from '../services/property-messages.service';

describe('PropertyMessagesController', () => {
  let controller: PropertyMessagesController;
  let messagesService: PropertyMessagesService;

  const mockMessagesService = {
    getUserConversations: jest.fn(),
    getThread: jest.fn(),
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyMessagesController],
      providers: [
        { provide: PropertyMessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    controller = module.get<PropertyMessagesController>(PropertyMessagesController);
    messagesService = module.get<PropertyMessagesService>(PropertyMessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserConversations', () => {
    it('should return conversations', async () => {
      mockMessagesService.getUserConversations.mockResolvedValue([]);
      const result = await controller.getUserConversations({ user: { id: 'u1' } } as any);
      expect(result).toBeDefined();
    });
  });

  describe('getThread', () => {
    it('should return thread', async () => {
      mockMessagesService.getThread.mockResolvedValue([]);
      const result = await controller.getThread({ user: { id: 'u1' } } as any, 'p1', 'u2');
      expect(result).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message', async () => {
      mockMessagesService.sendMessage.mockResolvedValue({ id: '1' });
      const result = await controller.sendMessage({ user: { id: 'u1' } } as any, 'p1', {} as any);
      expect(result.id).toBe('1');
    });
  });
});
