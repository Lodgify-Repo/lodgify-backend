import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('RoomsController (e2e)', () => {
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

  describe('RoomTypes', () => {
    it('/api/hotels/:hotelId/room-types (GET) should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/hotel-1/room-types')
        .expect((res) => {
          expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
        });
    });

    it('/api/hotels/:hotelId/room-types/:id (GET) should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/hotel-1/room-types/type-1')
        .expect((res) => {
          expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
        });
    });
  });

  describe('Rooms', () => {
    it('/api/hotels/:hotelId/rooms (GET) should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/hotel-1/rooms')
        .expect((res) => {
          expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
        });
    });

    it('/api/hotels/:hotelId/rooms/:roomId (GET) should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/hotels/hotel-1/rooms/room-1')
        .expect((res) => {
          expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
        });
    });
  });
});
