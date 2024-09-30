import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtService } from '@nestjs/jwt';
import { SocketWithUserData } from './types';
import { Observable, of } from 'rxjs';
import { ChatService } from './chat.service';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';

import {newMessageDemo} from 'src/mock/chat.data';
// @WebSocketGateway是一个装饰器，用于创建WebSocket网关类。WebSocket网关类是用于处理 WebSocket连接和消息的核心组件之一。
// 它充当WebSocket服务端的中间人，负责处理客户端发起的连接请求，并定义处理不同类型消息的逻辑
//@WebSocketGateway(3003, { path: '/ws',cors: { origin: '*' } })
@Injectable()
@UseGuards(WsAuthGuard)
@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket', 'polling']  })
export class EventGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {
    console.log('EventGateway created!!');
  }
  @WebSocketServer()
  server: Server;
  async afterInit(ws: Server) {
    this.chatService.setServer(ws);
    console.log('IM WebSocketServer Initialized');
  }
  //private static rooms: Map<string, RoomData> = new Map();
  private static participants: Map<string, string> = new Map(); // sockedId => roomId

  async handleConnection(client: SocketWithUserData) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) {
        throw new Error('Authorization header is missing');
      }
      const token = authHeader.replace('Bearer ', '');
      const { sub } = await this.jwtService.decode(token);
      client.user = {
        id: sub,
        lastActiveTime: client.handshake.issued,
      };
      this.chatService.addUserSocket(sub, client);
      console.log("client.user:",client.user);
      client.emit('newMessage', JSON.stringify({ cmd: 0, data: 'Welcome to IM' }));
      // newMessageDemo.forEach(item => {
      //   client.emit('newMessage', JSON.stringify(item));
      // });
    } catch (error) {
      console.log("handleConnection:",error);
      throw new UnauthorizedException();
    }

    console.log('connect ' + client.user.id);
  }

  async handleDisconnect(client: SocketWithUserData) {
    this.chatService.removeUserSocket(client.user.id);
    console.log('disconnect');
  }

  @SubscribeMessage('heartbeat')
  heartbeat(
    @ConnectedSocket() client: SocketWithUserData,
  ): Observable<WsResponse<number> | any> {
    console.log('heartbeat');
    client.user.lastActiveTime = Date.now();
    return of(client.user);
  }

  @SubscribeMessage('chat')
  chat(
    @MessageBody() data: any,
    @ConnectedSocket() client: SocketWithUserData,
  ): Observable<WsResponse<number> | any> {
    console.log(`send message: ${data.message}`);
    this.chatService.pushMessageToUser(data.toUserId, 'chat', {
      fromUser: client.user.id,
      content: data.message,
    });
    return of(data);
  }

  @SubscribeMessage('newMessage')
  handleMessage(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    console.log("newMessage:", body);
    const msg: any = {};
    const { roomId, name, message } = body || {};
    msg.text = message;
    msg.name = name;
    msg.roomId = roomId;
    this.server.to(roomId).emit('newMessage', msg);
  }
  // 离开房间
  @SubscribeMessage('leave')
  handleLeave(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    const { roomId, name } = body || {};
    // 先广播离开消息给房间内其他人
    this.server.to(roomId).emit('leave', `用户：${name}离开了房间 ${roomId}`);
    client.leave(roomId);
  }
  // 创建房间并加入房间
  @SubscribeMessage('join')
  handleJoin(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    const { roomId, name } = body || {};
    client.join(roomId);
    // client只能给发送给发起请求的客户端
    // client.emit('join', `用户：${name}加入了房间 ${roomId}`);
    // 广播消息给除自己以外的所有客户端
    // client.broadcast.emit('join', `用户：${name}加入了房间 ${roomId}`);
    // 使用服务器实例来广播消息给所有客户端
    this.server.to(roomId).emit('join', `用户：${name}加入了房间 ${roomId}`);
  }

  // 获取当前房间的人数
  @SubscribeMessage('getRoomUsers')
  handleGetRoomUsers(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.server.sockets.adapter.rooms.get(body.roomId);
    if (room) {
      this.server.to(body.roomId).emit('getRoomUsers', room.size);
    } else {
      this.server.to(body.roomId).emit('getRoomUsers', 0);
    }
  }
}
