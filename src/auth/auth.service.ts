import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';


@Injectable()
export class AuthService {
  constructor(private usersService: UserService, private jwtService: JwtService) {}

  async signIn(username: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findOneWithTenant({username: username, password: pass});
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { 
      id: user.id, 
      sub:user.id, 
      username: user.username,
      nickName: user.nickName,
      sex: user.sex,
      tenantId: user.tenant.id,
      domain: user.tenant.domain,
     };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOneBy({username: username, password: password});
    return user ? user : null;
  }
}
