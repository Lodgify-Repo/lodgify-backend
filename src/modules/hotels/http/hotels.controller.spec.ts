import { Test, TestingModule } from '@nestjs/testing';
import { HotelsController } from './hotels.controller';
import { HotelsService } from '../services/hotels.service';

describe('HotelsController', () => {
  let controller: HotelsController;
  let hotelsService: HotelsService;

  const mockHotelsService = {
    create: jest.fn(),
    findByOwner: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        { provide: HotelsService, useValue: mockHotelsService },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    hotelsService = module.get<HotelsService>(HotelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create hotel', async () => {
      mockHotelsService.create.mockResolvedValue({ id: '1' });
      const req = { user: { id: 'owner-1' } };
      const result = await controller.create(req, {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('getMyHotel', () => {
    it('should get hotel', async () => {
      mockHotelsService.findByOwner.mockResolvedValue({ id: '1' });
      const req = { user: { id: 'owner-1' } };
      const result = await controller.getMyHotel(req);
      expect(result.id).toBe('1');
    });
  });

  describe('updateMyHotel', () => {
    it('should update hotel', async () => {
      mockHotelsService.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const req = { user: { id: 'owner-1' } };
      const result = await controller.updateMyHotel(req, { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });
});
