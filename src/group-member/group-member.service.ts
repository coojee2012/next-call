import { Injectable } from '@nestjs/common';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMember } from './entities/group-member.entity';
@Injectable()
export class GroupMemberService extends BaseService<GroupMember> {
  constructor(
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {
    super(groupMemberRepository);
  }

  async findGroupIdsByUser(userId: number): Promise<number[]> {
    const groupIds = await this.groupMemberRepository
     .createQueryBuilder('groupMember')
     .select('groupMember.groupId')
     .where('groupMember.userId = :userId', { userId })
     .getRawMany();
    return groupIds.map((groupId) => groupId.groupMember_groupId);
  }
  
}
