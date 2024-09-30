import { Module } from '@nestjs/common';
import { EventGateway } from './events.gateway';
import { UserModule } from '../user/user.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { GroupModule } from 'src/group/group.module';
import { GroupMessageModule } from 'src/group-message/group-message.module';
import { PrivateMessageModule } from 'src/private-message/private-message.module';
@Module({
  imports: [
    UserModule,
    GroupModule,
    GroupMessageModule,
    PrivateMessageModule,
  ],
  providers: [EventGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}