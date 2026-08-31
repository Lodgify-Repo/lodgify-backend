import { Test, TestingModule } from '@nestjs/testing';
import { BookingListService } from './booking-list.service';
import { PrismaService } from '@/infra/database/prisma.service';

describe('BookingListService', () => {
  let service: BookingListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingListService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<BookingListService>(BookingListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
