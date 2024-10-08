import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isClientAliveNow } from 'src/chat/helper';
import { SocketWithUserData } from 'src/chat/types';

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs()?.getClient<SocketWithUserData>();
    const active = isClientAliveNow(client.user.lastActiveTime);
    active || client.disconnect();
    return active;
  }
}