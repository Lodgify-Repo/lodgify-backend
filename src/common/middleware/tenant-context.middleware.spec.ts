import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { PrismaService } from '@/infra/database/prisma.service';

describe('TenantContextMiddleware', () => {
  let middleware: TenantContextMiddleware;
  let mockPrisma: any;
  let mockConfigService: any;
  const testSecret = 'test-secret-key-12345';

  beforeEach(() => {
    mockPrisma = {
      hotel: {
        findFirst: jest.fn(),
      },
      branch: {
        findUnique: jest.fn(),
      },
      apiKey: {
        findFirst: jest.fn(),
        update: jest.fn().mockReturnValue(Promise.resolve()),
      },
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(testSecret),
    };

    middleware = new TenantContextMiddleware(mockPrisma as unknown as PrismaService, mockConfigService as ConfigService);
  });

  const createReqResNext = (headers: Record<string, string> = {}) => {
    const req: any = { headers };
    const res: any = {};
    const next = jest.fn();
    return { req, res, next };
  };

  it('should pass through without tenant when no auth headers are provided', async () => {
    const { req, res, next } = createReqResNext({});

    await middleware.use(req, res, next);

    expect(req.tenant).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  describe('JWT Authentication', () => {
    it('should extract tenant from JWT with explicit hotelId and enterprise tier', async () => {
      const token = jwt.sign(
        { sub: 'user-1', hotelId: 'hotel-999', tier: 'enterprise' },
        testSecret,
      );
      const { req, res, next } = createReqResNext({ authorization: `Bearer ${token}` });

      await middleware.use(req, res, next);

      expect(req.tenant).toEqual({
        id: 'hotel-999',
        tier: 'enterprise',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should resolve hotelId from database if user is a hotel owner', async () => {
      const token = jwt.sign(
        { sub: 'owner-user-id', role: 'HOTEL_OWNER' },
        testSecret,
      );
      mockPrisma.hotel.findFirst.mockResolvedValue({ id: 'hotel-from-db' });

      const { req, res, next } = createReqResNext({ authorization: `Bearer ${token}` });

      await middleware.use(req, res, next);

      expect(mockPrisma.hotel.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'owner-user-id', deletedAt: null },
        select: { id: true },
      });
      expect(req.tenant).toEqual({
        id: 'hotel-from-db',
        tier: 'standard',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail with UnauthorizedException if JWT is invalid or expired', async () => {
      const { req, res, next } = createReqResNext({ authorization: 'Bearer invalid-token' });

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    });
  });

  describe('API Key Authentication', () => {
    it('should validate API key against database and attach tenant context', async () => {
      const rawKey = 'prop_live_secretkey_123';
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

      mockPrisma.apiKey.findFirst.mockResolvedValue({
        id: 'key-id-1',
        tenantId: 'hotel-enterprise-1',
        tier: 'enterprise',
        permissions: ['READ_BOOKINGS', 'WRITE_BOOKINGS'],
        isActive: true,
        expiresAt: null,
      });

      const { req, res, next } = createReqResNext({ 'x-api-key': rawKey });

      await middleware.use(req, res, next);

      expect(mockPrisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ key: rawKey }, { key: hashedKey }],
          isActive: true,
        },
      });
      expect(req.tenant).toEqual({
        id: 'hotel-enterprise-1',
        tier: 'enterprise',
        apiKeyId: 'key-id-1',
        permissions: ['READ_BOOKINGS', 'WRITE_BOOKINGS'],
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid API key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);

      const { req, res, next } = createReqResNext({ 'x-api-key': 'non-existent-key' });

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    });

    it('should reject expired API key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        id: 'key-id-2',
        tenantId: 'hotel-1',
        tier: 'standard',
        isActive: true,
        expiresAt: new Date(Date.now() - 10000), // expired in past
      });

      const { req, res, next } = createReqResNext({ 'x-api-key': 'expired-key' });

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    });

    it('should reject empty API key header', async () => {
      const { req, res, next } = createReqResNext({ 'x-api-key': '   ' });

      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
    });
  });
});
