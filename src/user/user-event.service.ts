import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/BaseService';
import { UserEventEntity, UserEventType } from './entities/user_event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserEventService extends BaseService<UserEventEntity> {
  constructor(
    @InjectRepository(UserEventEntity)
    repository: Repository<UserEventEntity>,
    private userService: UserService
  ) {
    super(repository);
  }

  async add(
    tenantId: number,
    eventType: UserEventType,
    userId: number,
    memo?: string,
  ) {
    try {
     const user = await this.userService.findOne(userId)
      const doc = await this.create({
        user: user as UserEntity,
        eventType,
        tenantId,
        memo: memo ? memo : '',
      });
      return doc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
