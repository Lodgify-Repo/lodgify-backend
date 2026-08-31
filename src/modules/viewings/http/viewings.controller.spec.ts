import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsController } from './viewings.controller';
import { ViewingsService } from '../services/viewings.service';

describe('ViewingsController', () => {
  let controller: ViewingsController;
  let viewingsService: ViewingsService;

  const mockViewingsService = {
    schedule: jest.fn(),
    getMyViewings: jest.fn(),
    getOwnerViewings: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewingsController],
      providers: [
        { provide: ViewingsService, useValue: mockViewingsService },
      ],
    }).compile();

    controller = module.get<ViewingsController>(ViewingsController);
    viewingsService = module.get<ViewingsService>(ViewingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('schedule', () => {
    it('should schedule viewing', async () => {
      mockViewingsService.schedule.mockResolvedValue({ id: 'v1' });
      const result = await controller.schedule({ user: { id: 'u1' } } as any, {} as any);
      expect(result.id).toBe('v1');
    });
  });

  describe('updateStatus', () => {
    it('should update viewing status', async () => {
      mockViewingsService.updateStatus.mockResolvedValue({ id: 'v1', status: 'CONFIRMED' });
      const result = await controller.updateStatus('v1', { status: 'CONFIRMED' } as any);
      expect(result.status).toBe('CONFIRMED');
    });
  });
});
