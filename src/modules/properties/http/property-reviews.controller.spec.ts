import { Test, TestingModule } from '@nestjs/testing';
import { PropertyReviewsController } from './property-reviews.controller';
import { PropertyReviewsService } from '../services/property-reviews.service';

describe('PropertyReviewsController', () => {
  let controller: PropertyReviewsController;
  let reviewsService: PropertyReviewsService;

  const mockReviewsService = {
    getPropertyReviews: jest.fn(),
    createReview: jest.fn(),
    respondToReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyReviewsController],
      providers: [
        { provide: PropertyReviewsService, useValue: mockReviewsService },
      ],
    }).compile();

    controller = module.get<PropertyReviewsController>(PropertyReviewsController);
    reviewsService = module.get<PropertyReviewsService>(PropertyReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPropertyReviews', () => {
    it('should return reviews', async () => {
      mockReviewsService.getPropertyReviews.mockResolvedValue({ reviews: [] });
      const result = await controller.getPropertyReviews('p1');
      expect(result.reviews).toBeDefined();
    });
  });

  describe('createReview', () => {
    it('should create review', async () => {
      mockReviewsService.createReview.mockResolvedValue({ id: '1' });
      const result = await controller.createReview({ user: { id: 'u1' } } as any, 'p1', {} as any);
      expect(result.id).toBe('1');
    });
  });

  describe('respondToReview', () => {
    it('should respond to review', async () => {
      mockReviewsService.respondToReview.mockResolvedValue({ id: '1' });
      const result = await controller.respondToReview({ user: { id: 'u1' } } as any, 'r1', {} as any);
      expect(result.id).toBe('1');
    });
  });
});
