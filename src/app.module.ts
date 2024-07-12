import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CorsMiddleware } from './middware/cors/cors.middleware';
import { WhiteListMiddleware } from './middware/white-list/white-list.middleware';
import { UserService } from './user/user.service';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'ab',
      useValue: ['A', 'B'],
    },
    {
      provide: 'async',
      inject: [UserService],
      useFactory: async (userService: UserService) :Promise<string> => {
        return await new Promise((resolve: any, reject: any) => {
          setTimeout(() => {
            const user:string = userService.findOne(1);
            resolve(user);
          }, 2000)
        }); 
      }
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*'); // for all routes
    consumer.apply(WhiteListMiddleware).forRoutes('*');
  }
}
