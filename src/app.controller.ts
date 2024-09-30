import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Session,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { LoginUserDto } from './user/dto/login.dot';
import { Public } from './auth/constants';
import { AuthService } from './auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { join } from 'path';
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = join(__dirname, '../assets');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const exten = file.originalname.split('.').pop();
    cb(null, Date.now() + '.' + exten);
  },
});
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Public()
  @Post('login')
  async login(
    @Req() req: Request,
    @Body() body: LoginUserDto,
    @Session() session: any,
  ): Promise<any> {
    console.log('Login......');
    const { access_token } = await this.authService.signIn(
      body.userName,
      body.password,
    );
    return {
      accessToken: access_token,
      accessTokenExpiresIn: 3600,
      refreshToken: 'refreshToken',
      refreshTokenExpiresIn: 3600 * 24 * 7,
    };
  }
  @Get('system/config')
  async sysConfigs(@Session() session: any): Promise<any> {
    return { maxChannel: 9, iceServers: [] };
  }
  @Post('image/upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  imageUpload(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return {
      originUrl: `http://127.0.0.1:3001/static/${file.filename}`, // replace with your own domain and port
      thumbUrl: `http://127.0.0.1:3001/static/${file.filename}`, // replace with your own domain and port
    };
  }
  @Post('file/upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  fileUpload(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return  `http://127.0.0.1:3001/static/${file.filename}`; // replace with your own domain and port
     
  }
}
