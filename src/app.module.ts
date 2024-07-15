import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'config/configuration';
import databaseConfig from 'config/database.config';
import { IDtabaseConifg } from 'config/database.config';
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
      }),
      inject: [ConfigService],
    }),
    DgramModule.forRoot({address: '0.0.0.0', port: 3002}),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule implements NestModule {
  constructor(
		private readonly dgramService: DgramService,
		private readonly processService: ProcessService,
	) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*'); // for all routes
    consumer.apply(WhiteListMiddleware).forRoutes('*');
    const dgramSocketServer = this.dgramService.createDgramSocket();
		this.processService.onMessage(dgramSocketServer);
  }
}
