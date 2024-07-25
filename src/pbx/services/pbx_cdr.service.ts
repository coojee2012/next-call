import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { AnswerStatus, PbxCdr } from '../entities/pbx_cdr';
import { InjectRepository } from '@nestjs/typeorm';
import { HangupCase } from '../entities/pbx_queue_statistic';

@Injectable()
export class PbxCdrService extends BaseService<PbxCdr> {
  constructor(@InjectRepository(PbxCdr) repository: Repository<PbxCdr>) {
    super(repository);
  }
  async updateCalled(tenantId: number, callId: string, called: string) {
    try {
      const result = await this.updateOne(
        {
          tenantId,
          callId,
        },
        {
          called,
        },
      );
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async lastApp(callId: string, tenantId: number, lastApp: string) {
    try {
      const result = await this.updateOne(
        {
          tenantId,
          callId,
        },
        {
          lastApp,
        },
      );
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async createCdr(data: any): Promise<PbxCdr> {
    try {
      data.starTime = new Date();
      data.extData = ['a'];
      const newDoc = await this.create(data);
      return newDoc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async getByCallid(tenantId: number, callId: string) {
    try {
      const doc = await this.findOne({
        tenantId,
        callId,
      });
      return doc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
  async setAgentId({
    callId,
    tenantId,
    accountCode,
    whenAnswer = false,
    answerUuid,
  }: {
    callId: string;
    tenantId: number;
    accountCode: string;
    whenAnswer?: boolean;
    answerUuid?: string;
  }) {
    try {
      let updateData = {
        accountCode,
      };
      if (whenAnswer) {
        updateData = Object.assign({}, updateData, {
          answerStatus: 'answered',
          answerTime: new Date(),
        });
      }
      const result = await this.updateOne(
        {
          callId,
          tenantId,
        },
        { ...updateData },
      );
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async endChannel({
    callId,
    tenantId,
    hangupCase,
    hangupBy = '',
  }: {
    callId: string;
    tenantId: number;
    hangupCase: HangupCase;
    hangupBy: string;
  }) {
    try {
      const result = await this.updateOne(
        {
          callId,
          tenantId,
        },
        {
          alive: 'no',
          hangupCase: hangupCase,
          hangupBy,
          endTime: new Date(),
        },
      );
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async cdrBLegHangup(id: number, hangupCase: string) {
    const _this = this;
    try {
      const query = {
        id: id,
      };
      const data = {
        alive: 'no',
        hangupCase: hangupCase,

        endTime: new Date(),
      };
      const result = await this.updateOne(query, {
        ...data,
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async bLegAnswered(_id: number, bLegId: string) {
    try {
      const query = {
        id:_id,
      };
      const data = {
        callId: bLegId,
        answerStatus: AnswerStatus.ANSWERED,
        answerTime: new Date(),
      };
      const result = await this.updateOne(query, {
        ...data,
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async answered(tenantId: number, callId: string, associateId: string) {
    const _this = this;
    try {
      const query = {
        callId,
        tenantId,
      };
      const data = {
          answerStatus: AnswerStatus.ANSWERED,
          associateId: [associateId],
          answerTime: new Date(),
      };
      //   if (associateId && associateId !== '') {
      //     upObj.$push = {associateId};
      //   }
      const result = await this.updateOne(query, data);
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
