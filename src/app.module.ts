import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'config/configuration';
import databaseConfig from 'config/database.config';
import { IDtabaseConifg } from 'config/database.config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CorsMiddleware } from './middware/cors/cors.middleware';
import { WhiteListMiddleware } from './middware/white-list/white-list.middleware';
import { UserService } from './user/user.service';
import { LoggerModule } from './logger/logger.module';
import { RoleModule } from './role/role.module';
import { TasksModule } from './tasks/tasks.module';
import { RoleToUserEntity } from './common/entiies/RoleToUserEntity';
import { DgramModule } from './dgram/dgram.module';
import { ProcessModule } from './process/process.module';
import { GraphQLModule } from '@nestjs/graphql';
import * as GraphQLJSON from 'graphql-type-json';
import { join } from 'path';
import { DgramService } from './dgram/dgram.service';
import { ProcessService } from './process/process.service';
import { ApolloDriver } from '@nestjs/apollo';
import { EslModule } from './esl/esl.module';
import { EslService } from './esl/esl.service';
import { LoggerService } from './logger/logger.service';
import { PbxModule } from './pbx/pbx.module';
import { TenantModule } from './tenant/tenant.module';
import { Connection } from './esl/NodeESL/Connection';

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
      }),
      inject: [ConfigService],
    }),
    DgramModule.forRoot({ address: '0.0.0.0', port: 3002 }),
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
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get('redis.host'),
    //       port: configService.get('redis.port'),
    //       db: 10,
    //       password: configService.get('redis.password', undefined),
    //     },
    //     prefix: 'esl_bull',
    //   }),
    //   inject: [ConfigService],
    // }),
    UserModule,
    LoggerModule,
    RoleModule,
    TasksModule,
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      path: '/',
      resolvers: { JSON: GraphQLJSON },
      subscriptions: {
        path: '/ws',
        keepAlive: 10000,
      },
      installSubscriptionHandlers: true,
      resolverValidationOptions: {
        requireResolversForResolveType: false,
      },
      debug: true,
      definitions: {
        path: join(process.cwd(), 'src/graphql.schema.ts'),
        outputAs: 'class',
      },
    }),
    ProcessModule,
    EslModule,
    PbxModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(
    private readonly loggerr: LoggerService,
    private readonly dgramService: DgramService,
    private readonly processService: ProcessService,
    private readonly eslService: EslService,
  ) {}

  async configure(consumer: MiddlewareConsumer) {
    this.loggerr.setContext('START APP');
    consumer.apply(CorsMiddleware).forRoutes('*'); // for all routes
    consumer.apply(WhiteListMiddleware).forRoutes('*');
    const dgramSocketServer = this.dgramService.createDgramSocket();
    this.processService.onMessage(dgramSocketServer);
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
