import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Put, Res } from '@nestjs/common';
import { ChatService } from './chat.service'; 
import { GroupSendDto } from './dto/group-send.dto';
import { GroupMessageService } from 'src/group-message/group-message.service';
import { CreateGroupMessageDto } from 'src/group-message/dto/create-group-message.dto';
import { PrivateMessageService } from 'src/private-message/private-message.service';
import { CreatePrivateMessageDto } from 'src/private-message/dto/create-private-message.dto';
import { Request, Response } from 'express';
import { GroupService } from 'src/group/group.service';

@Controller('message')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly groupMessageService: GroupMessageService,
    private readonly privateMessageService: PrivateMessageService,
    private readonly groupService: GroupService,) {

    }
  @Post('group/send')
  async sendGroupMessage(@Req() req: Request, @Res() res: Response, @Body() groupSendDto: CreateGroupMessageDto) {
    //const nmsg = await this.groupMessageService.create(groupSendDto);
    const user = req.user as any;
    groupSendDto.sendId = +user.id;
    groupSendDto.sendNickName = user.nickName;
    groupSendDto.atUserIds = "";
    const group = await this.groupService.getGroupWithMembers(+groupSendDto.groupId);
    if (!group) {
      return res.status(400).json({
        message: 'Group not found'
      });
    }
    if (group.members.length < 2) {
      return res.status(400).json({
        message: 'Group should have at least 2 members'
      });
    }
    if(!group.members.some(member => member.userId === +user.id)) {
      return res.status(400).json({
        message: 'You are not a member of this group'
      });
    }
    
    const msg = await this.chatService.sendGroupMessage(groupSendDto, [...group.members.map(member => member.userId)]);
    return res.status(200).json(msg);
  }
  @Put('group/readed')
  async readGroupMessage(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    const { targetId: groupId } = body;
    return await this.chatService.readGroupMessage(+groupId, +user.id);
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