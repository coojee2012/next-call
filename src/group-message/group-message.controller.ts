import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { GroupMessageService } from './group-message.service';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { UpdateGroupMessageDto } from './dto/update-group-message.dto';
import { Request } from 'express';

@Controller('gmessage')
export class GroupMessageController {
  constructor(private readonly groupMessageService: GroupMessageService) {}

  @Post()
  create(@Body() createGroupMessageDto: CreateGroupMessageDto) {
    return this.groupMessageService.create(createGroupMessageDto);
  }

  @Get()
  findAll() {
    return this.groupMessageService.findAll();
  }

  @Get('pullOfflineMessage')
  pullOfflineMessage(@Req() req:Request,
  @Query('minId') minId: string) {
    const  user = req.user as any;
    const yourId = user.id;
    const messages = this.groupMessageService.pullOfflineMessage(yourId, +minId);
    return messages;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupMessageService.findOne({id: +id});
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupMessageDto: UpdateGroupMessageDto) {
    return this.groupMessageService.update(+id, updateGroupMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupMessageService.delete(+id);
  }
}
