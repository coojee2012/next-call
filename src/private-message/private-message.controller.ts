import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { PrivateMessageService } from './private-message.service';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';
import { Request, Response } from 'express';

@Controller('pmessage')
export class PrivateMessageController {
  constructor(private readonly privateMessageService: PrivateMessageService) {}

  @Post()
  create(@Body() createPrivateMessageDto: CreatePrivateMessageDto) {
    return this.privateMessageService.create(createPrivateMessageDto);
  }

  @Get()
  findAll() {
    return this.privateMessageService.findAll();
  }
  
  @Get('pullOfflineMessage')
  pullOfflineMessage(@Req() req:Request,) {
    const user = req.user as any;
    console.log("pullOfflineMessage:",user);
    return this.privateMessageService.pullOfflineMessage(+user.id);
  }

  @Get('maxReadedId')
  maxReadedId(@Req() req:Request, @Query('friendId') friendId: string) {
    const user = req.user as any;
    console.log("maxReadedId:",user, friendId);
    return this.privateMessageService.getMaxReadedId(user.id, +friendId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.privateMessageService.findOne({ id: +id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePrivateMessageDto: UpdatePrivateMessageDto) {
    return this.privateMessageService.update(+id, updatePrivateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.privateMessageService.delete(+id);
  }
}
