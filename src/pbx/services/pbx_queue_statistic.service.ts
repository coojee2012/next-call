import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { PbxQueueStatistic } from '../entities/pbx_queue_statistic';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PbxQueueStatisticService extends BaseService<PbxQueueStatistic> {
  constructor(@InjectRepository(PbxQueueStatistic) repository: Repository<PbxQueueStatistic>) {
    super(repository);
  }
  hangupCall(
    callId: string,
    tenantId: number,
    queueNumber: string,
    huangupBy: string,
  ) {}
  transferStatic(data: any) {}
  async answerCall(data: any): Promise<any> {}
}
