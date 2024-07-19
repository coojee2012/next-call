import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PbxAgentStatistic } from '../entities/pbx_agent_statistic';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
@Injectable()
export class PbxAgentStatisticService extends BaseService<PbxAgentStatistic> {
  constructor(@InjectRepository(PbxAgentStatistic) repository: Repository<PbxAgentStatistic>) {
    super(repository);
  }
  hangupCall(data:any) {
    
  }
  transferStatic(data:any) {

  }
  answerCall(data:any) {

  }
  setSatisfaction(callId:string, agentLeg:string, inputKey:number) {

  }
}
