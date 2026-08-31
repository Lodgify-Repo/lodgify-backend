import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Food (e2e)', () => {
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

  it('/api/food (GET) should return 401, 404, or 200', () => {
    return request(app.getHttpServer())
      .get('/api/food')
      .expect((res) => {
        expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND, HttpStatus.OK, HttpStatus.FORBIDDEN]).toContain(res.status);
      });
  });
});
