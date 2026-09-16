import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { JWT_SECRET } from '@/common/constants';
import { PrismaService } from '@/infra/database/prisma.service';

export interface TenantPayload {
  id: string;
  tier: 'standard' | 'enterprise';
  apiKeyId?: string;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantPayload;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', '') || JWT_SECRET || '';
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = (req.headers['x-api-key'] || req.headers['x-apikey']) as string | undefined;

      let tenantId: string | undefined;
      let tier: 'standard' | 'enterprise' = 'standard';
      let apiKeyId: string | undefined;
      let permissions: string[] | undefined;

      // 1. Extract and verify tenant context directly from verified JWT claims
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (!token) {
          throw new UnauthorizedException('Authentication token is missing.');
        }

        if (!this.jwtSecret) {
          throw new UnauthorizedException('JWT authentication is not configured on the server.');
        }

        let decoded: any;
        try {
          decoded = jwt.verify(token, this.jwtSecret) as any;
        } catch {
          throw new UnauthorizedException('Invalid or expired authentication token for tenant context.');
        }

        // Resolve tenant context from verified JWT payload claims
        if (decoded.hotelId) {
          tenantId = decoded.hotelId;
        } else if (decoded.tenantId) {
          tenantId = decoded.tenantId;
        } else if (decoded.branchId) {
          // If branchId is present, resolve parent hotel tenant ID
          const branch = await this.prisma.branch.findUnique({
            where: { id: decoded.branchId },
            select: { hotelId: true },
          });
          tenantId = branch?.hotelId || decoded.branchId;
        } else if (decoded.sub) {
          // Priority 2: Check if this user owns a hotel tenant
          const hotel = await this.prisma.hotel.findFirst({
            where: { ownerId: decoded.sub, deletedAt: null },
            select: { id: true },
          });
          tenantId = hotel?.id || decoded.sub;
        } else if (decoded.id) {
          tenantId = decoded.id;
        }

        tier = decoded.tier === 'enterprise' ? 'enterprise' : 'standard';
      } else if (apiKeyHeader) {
        // Server-to-server integrations: Validate API Key securely against the database
        const rawKey = apiKeyHeader.trim();
        if (!rawKey) {
          throw new UnauthorizedException('API key cannot be empty.');
        }

        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKeyRecord = await this.prisma.apiKey.findFirst({
          where: {
            OR: [{ key: rawKey }, { key: hashedKey }],
            isActive: true,
          },
        });

        if (!apiKeyRecord) {
          throw new UnauthorizedException('Invalid API key provided.');
        }

        if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
          throw new UnauthorizedException('API key has expired.');
        }

        tenantId = apiKeyRecord.tenantId;
        tier = apiKeyRecord.tier?.toLowerCase() === 'enterprise' ? 'enterprise' : 'standard';
        apiKeyId = apiKeyRecord.id;
        permissions = apiKeyRecord.permissions;

        // Asynchronously update last used timestamp without blocking the request
        this.prisma.apiKey
          .update({
            where: { id: apiKeyRecord.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      }

      // Attach contextual enterprise tenant scope onto the request object
      if (tenantId) {
        req.tenant = {
          id: tenantId,
          tier,
          ...(apiKeyId && { apiKeyId }),
          ...(permissions && { permissions }),
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
