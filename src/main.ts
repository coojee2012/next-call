import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use(
    session({
      secret: 'sun-shine',
      rolling: true,
      name: 'nest-demon.sid',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 24 * 3600 * 1000,
        httpOnly: true,
        sameSite: 'none', // strict need same domain; lax also same domaian, but has some special sence
        secure: false, // true need https
       },
    }),
  );
  await app.listen(3001);
}
bootstrap();
