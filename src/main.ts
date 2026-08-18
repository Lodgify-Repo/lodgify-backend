import { VersioningType, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnterpriseExceptionFilter } from './common/filters/enterprise-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  app.use(helmet());

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
    .setTitle('Lodgify Enterprise API')
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
