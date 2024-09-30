import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Put } from '@nestjs/common';
import { ChatService } from './chat.service'; 
import { GroupSendDto } from './dto/group-send.dto';
import { GroupMessageService } from 'src/group-message/group-message.service';
import { CreateGroupMessageDto } from 'src/group-message/dto/create-group-message.dto';
import { PrivateMessageService } from 'src/private-message/private-message.service';
import { CreatePrivateMessageDto } from 'src/private-message/dto/create-private-message.dto';
import { Request, Response } from 'express';

@Controller('message')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly groupMessageService: GroupMessageService,
    private readonly privateMessageService: PrivateMessageService,) {

    }
  @Post('group/send')
  async sendGroupMessage(@Req() req: Request,@Body() groupSendDto: CreateGroupMessageDto) {
    //const nmsg = await this.groupMessageService.create(groupSendDto);
    return await this.chatService.sendGroupMessage(groupSendDto);
  }
  @Post('private/send')
  async sendPrivateMessage(@Req() req: Request, @Body() privateDto: CreatePrivateMessageDto) {
    privateDto.sendTime = Date.now();
    const user = req.user as any;
    privateDto.sendId = +user.id;
    privateDto.recvId = +privateDto.recvId;
    return await this.chatService.sendPrivateMessage(privateDto);
  }
  @Put('private/readed')
  async readPrivateMessage(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    const { targetId: friendId } = body;
    return await this.chatService.readPrivateMessage(+friendId, +user.id);
  }
}