import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { VersioningType, ValidationPipe} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
      cors: true,
      bodyParser: true,
  });
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
  app.useGlobalPipes(new ValidationPipe({
    disableErrorMessages: false,
    whitelist: false, // if true, will delete dto values without @
    forbidNonWhitelisted: false,
    transform: true,
  }));
  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
