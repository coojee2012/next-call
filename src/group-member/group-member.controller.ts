import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { groupMemberDemo } from 'src/mock/chat.data';

@Controller('group-members')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Post()
  create(@Body() createGroupMemberDto: CreateGroupMemberDto) {
    return this.groupMemberService.create(createGroupMemberDto);
  }

  @Get()
  findAll() {
    return this.groupMemberService.findAll();
  }

  @Get(':id')
  findMembers(@Param('id') id: string) {
    return groupMemberDemo.data
    //return this.groupMemberService.findBy({ group: +id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupMemberDto: UpdateGroupMemberDto) {
    return this.groupMemberService.update(+id, updateGroupMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupMemberService.delete(+id);
  }
}
