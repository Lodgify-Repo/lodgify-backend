import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/common/constants';

export interface TenantPayload {
  id: string;
  tier: 'standard' | 'enterprise';
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
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId: string | undefined;
    let tier: string | undefined;

    // In production, we securely extract the tenant context from the verified JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET || 'super-secret-jwt-key') as any;
        tenantId = decoded.hotelId || decoded.branchId || decoded.sub || decoded.id;
        tier = decoded.tier;
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired authentication token for tenant context.');
      }
    } else {
      // Fallback for API Keys (e.g., server-to-server integrations where a JWT is not used)
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) {
        // Here you would validate the API key against the database
        // For demonstration, we'll map it to the provided headers if an API key is present
        tenantId = req.headers['x-tenant-id'] as string;
        tier = req.headers['x-tenant-tier'] as string;
      }
    }

    // Attach contextual enterprise scope onto the request object if a tenant was identified
    if (tenantId) {
      req.tenant = {
        id: tenantId,
        tier: tier === 'enterprise' ? 'enterprise' : 'standard',
      };
    }

    next();
  }
}
