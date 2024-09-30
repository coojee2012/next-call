import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { groupInfoDemo, groupListDemo } from 'src/mock/chat.data';
import { groupMemberDemo } from 'src/mock/chat.data';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserEntity } from 'src/user/entities/user.entity';
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  findAll() {
    //return groupListDemo.data;
    return this.groupService.findAll();
  }

  @Get('members/:groupId')
  findMembers(@Param('groupId') groupId: string) {    
    return groupMemberDemo.data;
  }
  @Get('find/:groupId')
  find(@Param('groupId') groupId: string) {
    return groupInfoDemo.data;
    //return this.groupService.findOne({ id: +id });
  }

  @Post('create')
  createGroup(@Req() req: Request,@Body() createGroupDto: CreateGroupDto) {
    const user = req.user as any;
    createGroupDto.ownerId = user.sub;
    createGroupDto.showGroupName = createGroupDto.name;
    return this.groupService.create(createGroupDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne({ id: +id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.delete(+id);
  }
}
