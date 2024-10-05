import { Injectable } from '@nestjs/common';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PrivateMessage } from './entities/private-message.entity';
import { min } from 'lodash';

@Injectable()
export class PrivateMessageService extends BaseService<PrivateMessage> {
  constructor(
    @InjectRepository(PrivateMessage)
    private readonly privateMessageRepository: Repository<PrivateMessage>,
  ) {
    super(privateMessageRepository);
  }
  async getMaxReadedId(userId: number, friendId: number) {
    const maxReadedId = await this.privateMessageRepository
     .createQueryBuilder('privateMessage')
     .where('privateMessage.send = :userId AND privateMessage.recv = :friendId', { userId, friendId })
     .orWhere('privateMessage.recv = :userId AND privateMessage.send = :friendId', {userId, friendId })
     .andWhere('privateMessage.status = 3') // 3 means read 2 means reback 1 means send 0 means unsend
     .orderBy('privateMessage.id', 'DESC')
     .getOne();
    return maxReadedId?.id;
  }

  async pullOfflineMessage(userId: number, minId: number) {
    const messages = await this.privateMessageRepository
    .createQueryBuilder('privateMessage')
    .where('privateMessage.id > :minId AND (privateMessage.send = :userId OR privateMessage.recv = :userId)', { minId, userId })
    //.where('privateMessage.id > :minId', {minId })
    .orderBy('privateMessage.id', 'ASC')
    .limit(100)
    .getMany();
    return messages;
    
  }
}
