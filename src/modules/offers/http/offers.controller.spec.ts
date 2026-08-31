import { Test, TestingModule } from '@nestjs/testing';
import { OffersController } from './offers.controller';
import { OffersService } from '../services/offers.service';

describe('OffersController', () => {
  let controller: OffersController;
  let offersService: OffersService;

  const mockOffersService = {
    create: jest.fn(),
    getMyOffers: jest.fn(),
    getOffersForProperty: jest.fn(),
    reviewOffer: jest.fn(),
    buyerRespondToCounter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        { provide: OffersService, useValue: mockOffersService },
      ],
    }).compile();

    controller = module.get<OffersController>(OffersController);
    offersService = module.get<OffersService>(OffersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create offer', async () => {
      mockOffersService.create.mockResolvedValue({ id: 'o1' });
      const result = await controller.create({ user: { id: 'u1' } } as any, {} as any);
      expect(result.id).toBe('o1');
    });
  });

  describe('reviewOffer', () => {
    it('should review offer', async () => {
      mockOffersService.reviewOffer.mockResolvedValue({ id: 'o1' });
      const result = await controller.reviewOffer({ user: { id: 'owner1' } } as any, 'o1', { decision: 'ACCEPT' } as any);
      expect(result.id).toBe('o1');
    });
  });
});
