import { Controller, Get, Post, Body, Patch, Param, Delete, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { groupMemberDemo } from 'src/mock/chat.data';
import { Group } from 'src/group/entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

@Controller('gmembers')
@UseInterceptors(ClassSerializerInterceptor)
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

  @Get(':groupId')
  async findMembers(@Param('groupId') groupId: string): Promise<GroupMember[]> {
    return await this.groupMemberService.findBy({ groupId: +groupId, quit: false });
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
