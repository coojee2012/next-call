import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  Session,
  ClassSerializerInterceptor,
  UseInterceptors,
  ParseIntPipe,
  UseGuards,
  Query,
  Put
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login.dot';

import * as svgCaptCha from 'svg-captcha';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { UpdateResult } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { onlineUsersDemo,findUserDemo } from 'src/mock/chat.data';
import {userInfoDemo} from'src/mock/chat.data';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(UserController.name);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserEntity | undefined> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserEntity[]> {
    const users =  await this.userService.findAll();
    return users;
  }

  @Get('code')
  createCode(
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: any,
  ) {
    const captcha = svgCaptCha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 35,
      background: '#cc9966',
    });
    session.code = captcha.text;
    console.log("session:", session);
    res.type('image/svg+xml');
    res.send(captcha.data);
  }

  @Post('authenticate')
  login(
    @Req() req: Request,
    @Body() body: LoginUserDto,
    @Session() session: any,
  ) {
    console.log('authenticate:',body, session);
    if (body?.code?.toLocaleLowerCase() == session?.code?.toLocaleLowerCase()) {
      return { code: 200 };
    } else {
      return { code: 500 };
    }
  }

  @Get('self')
  findSelf(@Req() req:Request,): Promise<UserEntity | null> {
    const user = req.user as UserEntity;
    const id = user?.id;
    return this.userService.findOne(+id);
  }
  @Get('terminal/online')
  async getOnlineUsers(): Promise<any> {
    return onlineUsersDemo.data;
  }

  @Get('findByName')
  async findByName(@Query('name') name: string): Promise<any> {
    return this.userService.findBy({ nickName: name });
  }

  @Get('find/:id')
  async findUserById(@Param('id', ParseIntPipe) id: number): Promise<UserEntity | null> {
    return this.userService.findOne(+id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity | null> {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) : Promise<UpdateResult> {
    return this.userService.update(+id, updateUserDto);
  }

  @Put([':id', 'update/:id'])
  update2(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) : Promise<UpdateResult> {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
