import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/infra/database/prisma.service';
import { Role } from '@prisma/client';

describe('Verification Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let agentToken: string;
  let ownerToken: string;
  let adminToken: string;
  
  const testAgent = {
    email: 'agent-verify@example.com',
    password: 'password123',
    firstName: 'Agent',
    lastName: 'Test',
    role: Role.AGENT,
  };

  const testOwner = {
    email: 'owner-verify@example.com',
    password: 'password123',
    firstName: 'Owner',
    lastName: 'Test',
    role: Role.PROPERTY_OWNER,
  };

  const testAdmin = {
    email: 'admin-verify@example.com',
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
    await prisma.agentProfile.deleteMany({ where: { user: { email: testAgent.email } } });
    await prisma.propertyOwnerProfile.deleteMany({ where: { user: { email: testOwner.email } } });
    await prisma.user.deleteMany({ where: { email: { in: [testAgent.email, testOwner.email, testAdmin.email] } } });
    
    // Register all
    await request(app.getHttpServer()).post('/api/auth/register').send(testAgent);
    await request(app.getHttpServer()).post('/api/auth/register').send(testOwner);
    await request(app.getHttpServer()).post('/api/auth/register').send(testAdmin);
    
    const res1 = await request(app.getHttpServer()).post('/api/auth/login').send({ email: testAgent.email, password: testAgent.password });
    agentToken = res1.body.access_token;

    const res2 = await request(app.getHttpServer()).post('/api/auth/login').send({ email: testOwner.email, password: testOwner.password });
    ownerToken = res2.body.access_token;

    const res3 = await request(app.getHttpServer()).post('/api/auth/login').send({ email: testAdmin.email, password: testAdmin.password });
    adminToken = res3.body.access_token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.agentProfile.deleteMany({ where: { user: { email: testAgent.email } } });
      await prisma.propertyOwnerProfile.deleteMany({ where: { user: { email: testOwner.email } } });
      await prisma.user.deleteMany({ where: { email: { in: [testAgent.email, testOwner.email, testAdmin.email] } } });
    }
    if (app) await app.close();
  });

  it('/api/agents/profile (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/agents/profile')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ agencyName: 'Test Agency', licenseNumber: '123' })
      .expect(HttpStatus.CREATED);
  });

  it('/api/agents/verify (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/agents/verify')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ licenseUrl: 'http://test.com/lic.pdf', companyRegistrationUrl: 'http://test.com/reg.pdf' })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.status).toBe('PENDING');
      });
  });

  it('/api/properties/verify-owner (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/properties/verify-owner')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ deedUrl: 'http://test.com/deed.pdf', utilityBillUrl: 'http://test.com/bill.pdf', idUrl: 'http://test.com/id.pdf' })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.status).toBe('PENDING');
      });
  });
});
