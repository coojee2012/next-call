import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { isNil } from 'lodash';
import { UserService } from '../user.service';
import { PrivateMessageService } from'src/private-message/private-message.service';

@Processor('chat')
@Injectable()
export class ChatConsumer {
  constructor(private readonly userService: UserService, 
    private readonly privateMessageService: PrivateMessageService) {}
  @Process()
  async test(job: Job<any>) {
    // TODO: 根据 job.data 的类型确定是处理私信还是群聊
    const fromUser = await this.userService.findOneBy({ id: job.data.fromUser });
    const toUser = await this.userService.findOneBy({ id: job.data.toUser });
    if (isNil(fromUser) || isNil(toUser)) {
      return;
    }
    const privateMessage = await this.privateMessageService.create({
      send: fromUser,
      recv: toUser,
      content: job.data.content,
    });
  }
}
