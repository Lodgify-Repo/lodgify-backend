import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from '../services/search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;

  const mockSearchService = {
    searchHotels: jest.fn(),
    searchProperties: jest.fn(),
    autocomplete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchService, useValue: mockSearchService },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchHotels', () => {
    it('should search hotels', async () => {
      mockSearchService.searchHotels.mockResolvedValue({ data: [] });
      const result = await controller.searchHotels({});
      expect(result.data).toBeDefined();
    });
  });

  describe('searchProperties', () => {
    it('should search properties', async () => {
      mockSearchService.searchProperties.mockResolvedValue({ data: [] });
      const result = await controller.searchProperties({});
      expect(result.data).toBeDefined();
    });
  });

  describe('autocomplete', () => {
    it('should autocomplete', async () => {
      mockSearchService.autocomplete.mockResolvedValue({ data: [] });
      const result = await controller.autocomplete({ query: 'test' });
      expect(result.data).toBeDefined();
    });
  });
});
