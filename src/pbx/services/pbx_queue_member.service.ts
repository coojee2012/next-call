import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxQueueMember } from '../entities/pbx_queue_member';
@Injectable()
export class PbxQueueMemberService extends BaseService<PbxQueueMember> {
    constructor(
      @InjectRepository(PbxQueueMember) repository: Repository<PbxQueueMember>,
    ) {
      super(repository);
    }
  }
