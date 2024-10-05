import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'config/configuration';
import databaseConfig from 'config/database.config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CorsMiddleware } from './middware/cors/cors.middleware';
import { WhiteListMiddleware } from './middware/white-list/white-list.middleware';
import { LoggerModule } from './logger/logger.module';
import { RoleModule } from './role/role.module';
import { TasksModule } from './tasks/tasks.module';
import { RoleToUserEntity } from './common/entiies/RoleToUserEntity';
import { EslModule } from './esl/esl.module';
import { EslService } from './esl/esl.service';
import { LoggerService } from './logger/logger.service';
import { PbxModule } from './pbx/pbx.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { FriendModule } from './friend/friend.module';
import { GroupModule } from './group/group.module';
import { ChatModule } from './chat/chat.module';
import { PrivateMessageModule } from './private-message/private-message.module';
import { GroupMessageModule } from './group-message/group-message.module';
import { SensitiveWordModule } from './sensitive-word/sensitive-word.module';
import { GroupMemberModule } from './group-member/group-member.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev.local', '.env.dev', '.env'],
      //配置文件路径
      ignoreEnvFile: false,
      //忽略配置文件，为true则仅读取操作系统环境变量，常用于生产环境
      isGlobal: true,
      //配置为全局可见，否则需要在每个模块中单独导入ConfigModule
      load: [configuration, databaseConfig],
      cache: true,
    }),
    CacheModule.register({
      ttl: 30, // seconds
      max: 10, // maximum number of items in cache
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [RoleToUserEntity],
        retryAttempts: 3,
        retryDelay: 3,
        synchronize: true, // live need to false
        autoLoadEntities: true,
        logging: true,
        bigNumberStrings: false, 
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: true,
      // the delimiter used to segment namespaces
      delimiter: '::',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10000,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    {
      ...BullModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          redis: {
            host: config.get('redis.host'),
            port: config.get('redis.port'),
            password: config.get('redis.password', undefined),
          },
        }),
      }),
      global: true,
    },
    {
      ...BullModule.registerQueue({
        name: 'chat',
      }),
      global: true,
    },
    UserModule,
    LoggerModule,
    RoleModule,
    TasksModule,
    EslModule,
    PbxModule,
    TenantModule,
    AuthModule,
    FriendModule,
    GroupModule,
    PrivateMessageModule,
    GroupMessageModule,
    SensitiveWordModule,
    GroupMemberModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(
    private readonly loggerr: LoggerService,
    private readonly eslService: EslService,
  ) {}

  async configure(consumer: MiddlewareConsumer) {
    this.loggerr.setContext('START APP');
    consumer.apply(CorsMiddleware).forRoutes('*'); // for all routes
    consumer.apply(WhiteListMiddleware).forRoutes('*');
    // await BullModule.registerQueueAsync({
    //   name: 'BullQueue,RedLock,PUB,SUB',
    // });
    this.eslService
      .startOutbound()
      .then((res) => {
        this.loggerr.info(null, 'ESL Outbound Server Started OK!');
      })
      .catch((err) => {
        this.loggerr.error(null, 'ESL Outbound Server Started Error!', err);
      });
    // this.eslService
    //   .startInbound()
    //   .then((res) => {
    //     this.loggerr.info(null, 'ESL Inbound Server Started OK!');
    //   })
    //   .catch((err) => {
    //     this.loggerr.info(null, 'ESL Inbound Server Started Error!', err);
    //   });
  }
}
