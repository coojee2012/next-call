import { Module } from '@nestjs/common';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: 3600 },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    {
      provide: 'JWT_TOKEN',
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return await config.get('app.jwtSecret');
      },
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
