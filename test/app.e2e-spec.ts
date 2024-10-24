import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('Empty challenges list', () => {
    return request(app.getHttpServer())
      .get('/challenge/list')
      .expect(200)
      .expect('[]');
  });

  it('Add challenge', () => {
    return request(app.getHttpServer())
      .post('/challenge/register')
      .send({userId: 'test', comment: 'Lets play'})
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveLength(1)
        expect(res.body[0]).toHaveProperty('userId')
        expect(res.body[0].userId).toEqual('test')
        expect(res.body[0]).toHaveProperty('comment')
        expect(res.body[0].comment).toEqual('Lets play')
        expect(res.body[0]).toHaveProperty('dateCreated')
      });
  });
});
