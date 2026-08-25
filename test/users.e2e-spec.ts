import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/infra/database/prisma.service';
import { Role } from '@prisma/client';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  
  const ownerUser = {
    email: 'owner-e2e@example.com',
    password: 'password123',
    firstName: 'Owner',
    lastName: 'Test',
    role: Role.HOTEL_OWNER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Clean up
    await prisma.subAccountInvitation.deleteMany({ where: { email: 'staff-e2e@example.com' } });
    await prisma.user.deleteMany({ where: { email: { in: [ownerUser.email, 'staff-e2e@example.com'] } } });
    
    // Register owner
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerUser);
      
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ownerUser.email, password: ownerUser.password });
      
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.subAccountInvitation.deleteMany({ where: { email: 'staff-e2e@example.com' } });
      await prisma.user.deleteMany({ where: { email: { in: [ownerUser.email, 'staff-e2e@example.com'] } } });
    }
    if (app) await app.close();
  });

  it('/api/users/sub-accounts/invite (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/users/sub-accounts/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'staff-e2e@example.com', role: Role.BRANCH_MANAGER })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.email).toBe('staff-e2e@example.com');
        expect(res.body.token).toBeDefined();
      });
  });

  it('/api/users/sub-accounts (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users/sub-accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
