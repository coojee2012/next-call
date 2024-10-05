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
import { GroupMessageService } from 'src/group-message/group-message.service';

@Injectable()
export class ChatService {

  // userId => socket id
  private userSocket: UserSocket;

  private server: Server;

  constructor(private privateMessageService: PrivateMessageService,
              private groupMessageService: GroupMessageService
  ) {
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

  async sendGroupMessage(groupSendDto: CreateGroupMessageDto, memberIds: number[]){
    // TODO
    groupSendDto.sendTime = new Date().getTime();
    groupSendDto.atUserIds = JSON.stringify(groupSendDto.atUserIds);
    //groupSendDto.status = MessageStatus.UNSEND;
    const groupMessage = await this.groupMessageService.create(groupSendDto);
    for (const memberId of memberIds) {
      const client = this.getUserSocket(memberId);
      if (isNil(client) || !isClientAliveNow(client.user.lastActiveTime)) {
        console.log(`${memberId} offline`);
        continue;
      }
      const msg = {
        cmd: 4,
        data: groupMessage
      }
      client.emit('newMessage', JSON.stringify(msg));
    }
    return groupMessage;
  }

  async  readGroupMessage(groupId: number, memberId: number) {
    await this.groupMessageService.readedByUser(groupId, memberId);
    const client = this.getUserSocket(memberId);
    if (isNil(client) || !isClientAliveNow(client.user.lastActiveTime)) {
      console.log(`${memberId} offline`);
      return;
    }
    const msg = {
      cmd: 6, // 群消息已读
      data: {
        groupId: groupId,
        status: MessageStatus.READED
      }
    }
    client.emit('newMessage', JSON.stringify(msg));
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