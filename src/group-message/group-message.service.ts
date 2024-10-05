import { Injectable } from '@nestjs/common';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { UpdateGroupMessageDto } from './dto/update-group-message.dto';
import { BaseService } from 'src/common/BaseService';
import { In, Like, Repository, MoreThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMessage } from './entities/group-message.entity';
import { GroupMemberService } from 'src/group-member/group-member.service';
@Injectable()
export class GroupMessageService extends BaseService<GroupMessage> {
  constructor(@InjectRepository(GroupMessage) repository: Repository<GroupMessage>, 
              private groupMemberService: GroupMemberService) {
    super(repository);
  }

  async readedByUser(userId: number, groupId: number) {
    const lastReadedMessage = await this.repository.findOne({
      where: {groupId, recvIds: Like(`%${userId},%`)},
      order: {id: 'DESC'}
    })
    if (!lastReadedMessage) {
      return null;
    }
    return await this.repository.update({ id: lastReadedMessage.id }, { recvIds: lastReadedMessage.recvIds.replace(new RegExp(`\\b${userId},\\b`), '') });
  }

  async pullOfflineMessage(userId: number, minId: number) {
    const myGroupIds = await this.groupMemberService.findGroupIdsByUser(userId);
    const messages = await this.repository.find({
      where: { groupId: In(myGroupIds), id: MoreThan(minId) },
      order: { id: 'ASC' }
    });
    return messages;
  }
    
}
