import { Injectable } from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { Friend } from './entities/friend.entity';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FriendService extends BaseService<Friend> {
  constructor(@InjectRepository(Friend) repository: Repository<Friend>) {
    super(repository);
  }
}
