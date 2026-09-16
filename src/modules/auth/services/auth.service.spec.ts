import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { QueueService } from '@/infra/queue/queue.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DomainError } from '@/common/domain/error';
import { AuthErrorCodes } from '../errors';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let queueService: QueueService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    hotel: {
      findUnique: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  const mockQueue = {
    addJob: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return user if credentials are correct', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
        isActive: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toEqual(mockUser.email);
    });

    it('should throw an error if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(DomainError);
    });

    it('should throw an error if account is disabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', isActive: false });

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(DomainError);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'new@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.TRAVELER,
        password: 'hashedpassword',
      });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.TRAVELER,
      });

      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@test.com' });

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: Role.TRAVELER,
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('forgotPassword', () => {
    it('should send an email if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      mockPrisma.user.update.mockResolvedValue({ id: '1' });

      await service.forgotPassword({ email: 'test@test.com' });

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockQueue.addJob).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should generate token with hotelId for HOTEL_OWNER', async () => {
      mockPrisma.hotel.findUnique.mockResolvedValue({ id: 'hotel-owner-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        id: 'owner-id',
        email: 'owner@hotel.com',
        role: 'HOTEL_OWNER',
        firstName: 'Hotel',
        lastName: 'Owner',
      });

      expect(result.access_token).toBe('mocked-jwt-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelId: 'hotel-owner-1',
          tenantId: 'hotel-owner-1',
          tier: 'standard',
        }),
      );
    });
  });
});
