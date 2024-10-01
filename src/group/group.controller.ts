import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Put,
  Res,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { groupInfoDemo, groupListDemo } from 'src/mock/chat.data';
import { groupMemberDemo } from 'src/mock/chat.data';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserEntity } from 'src/user/entities/user.entity';
import { GroupMemberService } from 'src/group-member/group-member.service';
@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly groupMemberService: GroupMemberService,
  ) {}

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
    //return groupInfoDemo.data;
    return this.groupService.findOne({ id: +groupId });
  }

  @Post('create')
  async createGroup(
    @Req() req: Request,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    const user = req.user as any;
    createGroupDto.ownerId = user.id;
    createGroupDto.showGroupName = createGroupDto.name;
    const group = await this.groupService.create(createGroupDto);
    await this.groupMemberService.create({
      groupId: group.id,
      userId: user.id,
    });
    return group;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne({ id: +id });
  }

  @Put([':id', 'modify/:id'])
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<any> {
    const user = req.user as UserEntity;
    const group = await this.groupService.findOne({ id: +id });
    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
      });
    }
      
    if (group.ownerId !== user.id) {
      return res.status(500).json({
        message: 'You are not the owner of this group',
      });
    }
    const updatedGroup = await this.groupService.update(+id, updateGroupDto);
    return  res.status(201).json(updatedGroup);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.delete(+id);
  }
}
