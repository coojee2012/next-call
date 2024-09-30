import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { VersioningType, ValidationPipe} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
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

  app.useStaticAssets(join(__dirname, '../assets'), {
    prefix: '/static/', //设置虚拟前缀路径
    maxAge: 1000 * 60, //设置缓存时间
  });

  // 设置swagger文档
  const config = new DocumentBuilder()
    .setTitle('管理后台')   
    .setDescription('管理后台接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
  // Gracefully shutdown the server.
  app.enableShutdownHooks();
}
bootstrap();
