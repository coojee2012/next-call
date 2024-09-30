import { Injectable } from '@nestjs/common';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { UpdateGroupMessageDto } from './dto/update-group-message.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMessage } from './entities/group-message.entity';
@Injectable()
export class GroupMessageService extends BaseService<GroupMessage> {
  constructor(@InjectRepository(GroupMessage) repository: Repository<GroupMessage>) {
    super(repository);
  }
}
