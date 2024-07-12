import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    @Inject('async') private readonly testAsync: Promise<string>,
    @Inject('ab') private readonly ab:string[]
  ) {}

  @Get()
  getHello(): string {
    console.log(this.testAsync)
    console.log("2222")
    console.log(this.ab)
    return this.appService.getHello();
  }
}
