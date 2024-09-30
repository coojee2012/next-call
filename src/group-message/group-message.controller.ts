import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupMessageService } from './group-message.service';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { UpdateGroupMessageDto } from './dto/update-group-message.dto';

@Controller('group-message')
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
  pullOfflineMessage() {
    return [];
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
