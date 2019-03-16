import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { INestApplication } from '@nestjs/common';
import { AppService } from '../src/app.service';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
      dotenv.config({ path: `${process.env.NODE_ENV}.env` });
      const module = await Test.createTestingModule({
          imports: [
              AppModule,
              ConfigModule.load(path.resolve(__dirname, '..', 'src', 'config', '**', '!(*.d).{ts,js}')),
              TypeOrmModule.forRootAsync({
                  useFactory: (config: ConfigService) => config.get('database'),
                  inject: [ConfigService],
              }),
              ],
          providers: [AppService],
      })
          .compile();

      app = module.createNestApplication();
      await app.init();
  });

  afterAll(async () => {
      await app.close();
  });

  it('GET /api/ping', () => {
    return request(app.getHttpServer())
      .get('/api/ping')
      .expect(200)
      .expect('pong');
  });
});
