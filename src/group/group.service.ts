import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMemberService } from 'src/group-member/group-member.service';
@Injectable()
export class GroupService extends BaseService<Group> {
  constructor(@InjectRepository(Group) repository: Repository<Group>, 
  private groupMemberService: GroupMemberService) {
    super(repository);
  }

  async getGroupWithMembers(groupId: number): Promise<Group | null> {
    const group = await this.repository.findOne({
      where: {id: groupId},
      relations: {members: true}
    });
    if (!group) {
      return null;
    }
    return group;
  }

  async isJoined(userId: number, groupId: number): Promise<boolean> {
    const group = await this.repository.findOne({
      where: {id: groupId},
      relations: {members: true}
    });
    if (!group) {
      return false;
    }
    return  group.members.some(member => member.userId === userId);
  }

  async isOwner(userId: number, groupId: number): Promise<boolean> {
    const group = await super.findOne({id: groupId});
    if (!group) {
      return false;
    }
    return group.ownerId === userId;
  }



}
