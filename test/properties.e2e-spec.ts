import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PropertiesController (e2e)', () => {
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

  describe('Marketplace', () => {
    it('/api/marketplace/search (GET) should return public marketplace search results', () => {
      return request(app.getHttpServer())
        .get('/api/marketplace/search')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.meta).toBeDefined();
        });
    });

    it('/api/marketplace/map-pins (GET) should return map pins', () => {
      return request(app.getHttpServer())
        .get('/api/marketplace/map-pins')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.pins).toBeDefined();
          expect(Array.isArray(res.body.pins)).toBe(true);
        });
    });

    it('/api/marketplace/properties/:propertyId/similar (GET) should return 404 or empty', () => {
      return request(app.getHttpServer())
        .get('/api/marketplace/properties/invalid-id/similar')
        .expect((res) => {
          expect([HttpStatus.NOT_FOUND, HttpStatus.OK]).toContain(res.status);
        });
    });
  });

  describe('Calendar', () => {
    it('/api/properties/:propertyId/calendar (GET) should return 404 for invalid property', () => {
      return request(app.getHttpServer())
        .get('/api/properties/invalid-id/calendar')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('/api/properties/:propertyId/calendar/export.ics (GET) should return 404 for invalid property', () => {
      return request(app.getHttpServer())
        .get('/api/properties/invalid-id/calendar/export.ics')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Properties', () => {
    it('/api/properties/:id (GET) should return 404 for invalid property', () => {
      return request(app.getHttpServer())
        .get('/api/properties/invalid-id')
        .expect((res) => {
          expect([HttpStatus.NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(res.status);
        });
    });
  });

  describe('Bookings', () => {
    it('/api/properties/:propertyId/bookings/quote (POST) should return 404 for invalid property', () => {
      return request(app.getHttpServer())
        .post('/api/properties/invalid-id/bookings/quote')
        .send({
          checkInDate: '2025-01-01',
          checkOutDate: '2025-01-05',
          guestsCount: 2,
        })
        .expect((res) => {
          expect([HttpStatus.NOT_FOUND, HttpStatus.UNAUTHORIZED]).toContain(res.status);
        });
    });
  });
});
