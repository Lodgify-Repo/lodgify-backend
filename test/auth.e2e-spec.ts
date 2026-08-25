import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/infra/database/prisma.service';
import { Role } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  const testUser = {
    email: 'e2e-test-user@example.com',
    password: 'password123',
    firstName: 'E2E',
    lastName: 'Test',
    role: Role.TRAVELER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Clean up
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    }
    if (app) await app.close();
  });

  it('/api/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
      });
  });

  let accessToken = '';

  it('/api/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.header['set-cookie']).toBeDefined();
        accessToken = res.body.access_token;
      });
  });

  it('/api/auth/refresh (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(HttpStatus.OK)
      .then((loginRes) => {
        const cookie = loginRes.header['set-cookie'];
        return request(app.getHttpServer())
          .post('/api/auth/refresh')
          .set('Cookie', cookie)
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body.access_token).toBeDefined();
          });
      });
  });

  it('/api/auth/forgot-password (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.message).toContain('reset link');
      });
  });
});
