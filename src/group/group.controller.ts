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
import { groupMemberDemo } from 'src/mock/chat.data';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserEntity } from 'src/user/entities/user.entity';
import { GroupMemberService } from 'src/group-member/group-member.service';
import { InviteDTO } from './dto/invite.dto';
import { UserService } from 'src/user/user.service';
@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly groupMemberService: GroupMemberService,
    private readonly userService: UserService,
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

  @Post('invite/:id') // 邀请加入群组
  async inviteGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() inviteGroupDto: InviteDTO,
  ): Promise<any> {
    const user = req.user as UserEntity;
    const group = await this.groupService.findOne({ id: +id });
    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
      });
    }
    const groupMembers = await this.groupMemberService.findBy({
      groupId: group.id,
    });
    const groupMemberIds = groupMembers.map((item) => item.userId);
    if (!groupMemberIds.includes(user.id)) {
      return res.status(401).json({
        message: 'You are not a member of this group',
      });
    }
    const {friendIds} = inviteGroupDto;
    const inviteUerIds = friendIds.filter((userId) => !groupMemberIds.includes(userId));
    if (inviteUerIds.length === 0) {
      return res.status(400).json({
        message: 'All users have been invited to the group',
      });
    }
    for (const userId of inviteUerIds) {
      const inviteUser = await this.userService.findOne(userId);
      if (!inviteUser) {
        continue; // 跳过不存在的用户
      }
      await this.groupMemberService.create({
        groupId: group.id,
        userId: inviteUser.id,
        userNickName: inviteUser.nickName,
      });
    }
    return res.status(201).json({
      message: 'Users have been invited to the group successfully',
    });
  }
  

  @Post('join/:id')
  async joinGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ): Promise<any> {
    const user = req.user as UserEntity;
    const group = await this.groupService.findOne({ id: +id });
    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
      });
    }
    const groupMember = await this.groupMemberService.findOne({
      groupId: group.id,
      userId: user.id,
      userNickName: user.nickName,
    });
    if (groupMember) {
      return res.status(400).json({
        message: 'You are already a member of this group',
      });
    }
    await this.groupMemberService.create({
      groupId: group.id,
      userId: user.id,
    });
    return res.status(201).json({
      message: 'You have joined the group successfully',
    });
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
      const groupMember = await this.groupMemberService.findOne({
        groupId: group.id,
        userId: user.id,
        userNickName: user.nickName,
      });
      if (!groupMember) {
        return res.status(401).json({
          message: 'You are not a member of this group',
        });
      } else {  
        const updateGroupMember = await this.groupMemberService.updateBy({groupId: group.id, userId: user.id}, 
          {
          remarkGroupName: updateGroupDto.remarkNickName,
        });
        return res.status(201).json(updateGroupMember);
      }
    }
    const updatedGroup = await this.groupService.update(+id, updateGroupDto);
    return res.status(201).json(updatedGroup);
  }

  @Delete('quit/:id')
  async quitGroup(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ): Promise<any> {
    const user = req.user as UserEntity;
    const group = await this.groupService.findOne({ id: +id });
    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
      });
    }
    const groupMember = await this.groupMemberService.findOne({
      groupId: group.id,
      userId: user.id,
    });
    if (!groupMember) {
      return res.status(401).json({
        message: 'You are not a member of this group',
      });
    }
    await this.groupMemberService.delete(groupMember.id);
    return res.status(201).json({
      message: 'You have left the group successfully',
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.delete(+id);
  }
}
