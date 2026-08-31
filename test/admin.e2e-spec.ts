import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/infra/database/prisma.service';
import { Role } from '@prisma/client';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  const adminUser = {
    email: 'admin-e2e@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'Test',
    role: Role.ADMIN,
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
    await prisma.auditLog.deleteMany({ where: { actorEmail: adminUser.email } });
    await prisma.user.deleteMany({ where: { email: adminUser.email } });
    
    // Register admin
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminUser);
      
    // Manually set as ADMIN in DB (since register might not allow it directly depending on logic)
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { role: Role.ADMIN },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
      
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditLog.deleteMany({ where: { actorEmail: adminUser.email } });
      await prisma.user.deleteMany({ where: { email: adminUser.email } });
    }
    if (app) await app.close();
  });

  it('/api/admin/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/api/admin/logs (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/admin/logs?source=audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
