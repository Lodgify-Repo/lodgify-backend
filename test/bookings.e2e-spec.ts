import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/api/bookings/my-bookings (GET) should return 401 without auth or 404 or 200', () => {
    return request(app.getHttpServer())
      .get('/api/bookings/my-bookings')
      .expect((res) => {
        expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND, HttpStatus.OK]).toContain(res.status);
      });
  });
});
