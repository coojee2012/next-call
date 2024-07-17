import { Injectable } from '@nestjs/common';
import { PbxAgent } from '../entities/pbx_agent';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class PbxAgentService extends BaseService<PbxAgent> {
  constructor(@InjectRepository(PbxAgent) repository: Repository<PbxAgent>) {
    super(repository);
  }
  getRoundRobinAgents(tenantId: number, queueNumber: string): PbxAgent[] {
    return [];
  }
  newCall(data:any) {

  }
  answerCall(data:any) {}
  noAnsweredCall(data:any) {}
}
