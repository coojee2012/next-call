import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { UserEntity } from '../user/entities/user.entity';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }
 
  async validate(payload: any) {
    // 这里可以添加你的逻辑来从payload中提取用户信息
    console.log('validate payload:', payload);
    return { id: payload.sub, username: payload.username } as UserEntity;
  }
}