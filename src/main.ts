import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { Logger } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
    // const environment = dotenv.parse(fs.readFileSync(`${process.env.NODE_ENV}.env`));
    dotenv.config({ path: `${process.env.NODE_ENV}.env` });
    const port = process.env.PORT;
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    Logger.log(`Environment: ${process.env.NODE_ENV}`, 'Bootstrap');
    Logger.log(`Server listening on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
