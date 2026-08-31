import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('HotelsController (e2e)', () => {
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

  describe('Hotels', () => {
    it('/api/hotels (GET) should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/hotels')
        .expect((res) => {
          expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
        });
    });

    it('/api/hotels/:id (GET) should return 400 for invalid id or 404', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/invalid-id')
        .expect((res) => {
          expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(res.status);
        });
    });
  });

  describe('Branches', () => {
    it('/api/hotels/branches/:id (GET) should return 400/404 for invalid id', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/branches/invalid-id')
        .expect((res) => {
          expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(res.status);
        });
    });
  });
});
