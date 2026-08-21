import { VersioningType, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnterpriseExceptionFilter } from './common/filters/enterprise-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { allowedOrigins } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(helmet());

  const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
  });

  // Global rate limiting: 100 requests per 15 minutes per IP
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
      }),
      message: {
        type: 'https://api.lodgify.com/errors/too-many-requests',
        title: 'Too Many Requests',
        status: 429,
        detail: 'You have exceeded the rate limit. Please try again later.',
      },
    }),
  );

  //  Enforce global /api prefix
  app.setGlobalPrefix('api');

  //  Enable Global URI Versioning (Yields: /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  //  Enforce standardized response wrapper envelopes
  app.useGlobalInterceptors(new TransformInterceptor());

  //  Enforce enterprise RFC 7807 standard error layout globally
  app.useGlobalFilters(new EnterpriseExceptionFilter());

  //  Enforce Strict DTO Validation rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unvalidated/hidden properties
      forbidNonWhitelisted: true, // Reject requests with unexpected properties
      transform: true,            // Auto-transform payloads to typed class DTOs
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Lodgify API')
    .setDescription('The official API documentation for the Lodgify platform.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
