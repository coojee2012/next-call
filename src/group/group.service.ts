import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
@Injectable()
export class GroupService extends BaseService<Group> {
  constructor(@InjectRepository(Group) repository: Repository<Group>) {
    super(repository);
  }
}
