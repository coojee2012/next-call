import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Ip,
  Req,
  Res,
  Session,
  Inject,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login.dot';
import { IUser } from './interfaces/user.interface';
import * as svgCaptCha from 'svg-captcha';
import { Request, Response } from 'express';
import session from 'express-session';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(): IUser[] {
    return this.userService.findAll();
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
    console.log(session);
    res.type('image/svg+xml');
    res.send(captcha.data);
  }

  @Post('authenticate')
  login(@Req() req: Request, @Body() body: LoginUserDto, @Session() session: any) {
    console.log(body, session);
    if (body?.code?.toLocaleLowerCase() == session?.code?.toLocaleLowerCase()) {
      return { code: 200 };
    } else {
      return { code: 500 };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
