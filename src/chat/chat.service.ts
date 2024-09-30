import { Injectable } from '@nestjs/common';
import { SocketWithUserData, UserSocket } from './types';
import { Server } from 'socket.io';
import { isClientAliveNow } from './helper';
import { isNil } from 'lodash';
import { CreateGroupMessageDto } from 'src/group-message/dto/create-group-message.dto';
import { CreatePrivateMessageDto } from 'src/private-message/dto/create-private-message.dto';
import { PrivateMessageService } from 'src/private-message/private-message.service';
import { PrivateMessage } from 'src/private-message/entities/private-message.entity';
import {MessageStatus} from'src/constants/app';

@Injectable()
export class ChatService {

  // userId => socket id
  private userSocket: UserSocket;

  private server: Server;

  constructor(private privateMessageService: PrivateMessageService) {
    this.userSocket = new Map();
  }

  setServer(server: Server) {
    this.server = server;
  }

  initUserSocket() {
    this.userSocket = new Map();
  }

  getUserSocket(userId: number) {
    return this.userSocket.get(+userId);
  }

  addUserSocket(userId: number, client: SocketWithUserData) {
    this.userSocket.set(+userId, client);
  }

  removeUserSocket(userId: number) {
    this.userSocket.delete(+userId);
  }

  async pushMessageToUser(toUserId: number, event: string, data: any) {
    const client = this.getUserSocket(+toUserId);
    console.log("client:", client);
    if (isNil(client) || !isClientAliveNow(client.user.lastActiveTime)) {
      console.log(`${toUserId} offline`);
      return;
    }
    client.emit(event, data);
  }

  async sendGroupMessage(groupSendDto: CreateGroupMessageDto){
    // TODO
    return {
          "id": 100950,
          "groupId": 1853,
          "sendId": 2,
          "sendNickName": "王五",
          "content": "12332",
          "type": 0,
          "receipt": false,
          "receiptOk": null,
          "readedCount": 0,
          "atUserIds": [],
          "status": null,
          "sendTime": 1727596892639
      }
  
  }

  async sendPrivateMessage(dto:CreatePrivateMessageDto): Promise<PrivateMessage | null> {
    const toUserId = + dto.recvId;
    dto.status = MessageStatus.UNSEND;
    const nmsg = await this.privateMessageService.create(dto);
    nmsg.id = +nmsg.id;
    const client = this.getUserSocket(+toUserId);
    if (isNil(client) || !isClientAliveNow(client.user.lastActiveTime)) {
      console.log(`${toUserId} offline`);
      return nmsg;
    }
    const msg = {
      cmd: 3,
      data: nmsg
    }
    client.emit('newMessage', JSON.stringify(msg));
    await this.privateMessageService.update(nmsg.id, {status: MessageStatus.SENDED});
    return nmsg;
  }

  async readPrivateMessage(sendId: number, friendId: number) {
    const client = this.getUserSocket(+sendId);
    const ref =  await this.privateMessageService.updateBy({
      sendId, 
      recvId: friendId, 
      status: MessageStatus.SENDED
    }, {status: MessageStatus.READED})
    console.log("readPrivateMessage:", ref);
    if (isNil(client) || !isClientAliveNow(client.user.lastActiveTime)) {
      console.log(`${sendId} offline`);
      return;
    }
    const msg = {
      cmd: 7, // 好友阅读了消息
      data: {
        friendId: friendId,
        status: MessageStatus.READED
      }
    }
    client.emit('newMessage', JSON.stringify(msg));
  }
    
}