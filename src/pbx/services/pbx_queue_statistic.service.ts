import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { HangupCase, PbxQueueStatistic } from '../entities/pbx_queue_statistic';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PbxQueueStatisticService extends BaseService<PbxQueueStatistic> {
  constructor(
    @InjectRepository(PbxQueueStatistic)
    repository: Repository<PbxQueueStatistic>,
  ) {
    super(repository);
  }

  /**
   * @description 更新满意度的值
   * @param tenantId
   * @param callId
   * @param queueNumber
   * @param value
   */
  async updateSatisValue(
    tenantId:number,
    callId:string,
    queueNumber: string,
    value: number,
  ): Promise<number> {
    try {
      const doc = await this.updateOne(
        {
          tenantId: tenantId,
          callId: callId,
          satisfaction: 0,
        },
        {
          queueNumber: queueNumber,
          satisfaction: value,
        },
      );
      return doc?1:0;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async findOne(query:any): Promise<PbxQueueStatistic |null> {
    try {
      const doc = await super.findOne( query );
      return doc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async hangupCall(
    callId: string,
    tenantId: number,
    queueNumber: string,
    hangupCase: HangupCase,
  ): Promise<number> {
    try {
      const doc = await this.updateOne(
        {
          tenantId: tenantId,
          callId: callId,
          queueNumber: queueNumber,
        },
        {
          hangupCase,
          hangupTime: new Date(),
        }
      );
      return doc?1:0;;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async transferStatic({ callId, tenantId, queueNumber }: { callId:string, tenantId:number, queueNumber:string }) {
    try {
      const doc =
        await this.updateOne(
          {
            callId,
            tenantId,
            queueNumber,
          },
          {
              transferStatic: new Date(),
          },
        );
        return doc?1:0;;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async answerCall({
    callId,
    tenantId,
    queueNumber,
    answerAgent,
    answerAgentId,
  }: {
    callId:string,
    tenantId:number,
    queueNumber:string,
    answerAgent:string,
    answerAgentId:number,
  }) {
    try {
      const doc =
        await this.updateOne(
          {
            callId,
            tenantId,
            queueNumber,
          },
          {
           
              answerAgent,
              answerAgentId,
              answerTime: new Date(),
           
          },
        );
        return doc?1:0;;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
