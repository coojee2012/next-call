import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Put } from '@nestjs/common';
import { FriendService } from './friend.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { friendListDemo } from 'src/mock/chat.data';
import { UserEntity } from 'src/user/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService,
     private readonly userService: UserService) {}

  @Post(["", "add"])
  async create(@Req() req: Request, @Body() createFriendDto: CreateFriendDto): Promise<any> {
    const user = req.user as any;
    console.log(user, createFriendDto);
    createFriendDto.userId = user.sub;
    const friend = await this.userService.findOne(createFriendDto.friendId);
    if(!friend) {
      return {
        code: 400,
        message: "用户不存在"
      }
    }
    createFriendDto.headImage = friend.headImageThumb;
    createFriendDto.nickName = friend.nickName;
    return await this.friendService.create(createFriendDto);
  }

  @Get()
  async findAll(@Req() req: Request): Promise<any[]> {
    const user = req.user as any;
    console.log("findAll friend:",user);
    const friends = await this.friendService.findBy({userId: +user.id});
    return friends;
    // const friendIds = friends.map(item => item.friendId);
    // return this.userService.findWithIds(friendIds);
  }

  @Get('find/:friendId')
  findFriend(@Req() req: Request, @Param('friendId') friendId: string) {
    const user = req.user as any;
    return this.friendService.findOne({friendId: +friendId, userId: user.id});
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.friendService.findOne({id});
  }

  @Put([':id', 'update/:id'])
  update(@Param('id') id: string, @Body() updateFriendDto: UpdateFriendDto) {
    const {headImage, nickName,} = updateFriendDto;
    return this.friendService.update(+id, {headImage, nickName});
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
   return this.friendService.delete(+id);
  }
}
