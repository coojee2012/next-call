import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxIvrMenmu } from '../entities/pbx_ivr_menmu';
@Injectable()
export class PbxIvrMenmuService extends BaseService<PbxIvrMenmu> {
    constructor(
      @InjectRepository(PbxIvrMenmu) repository: Repository<PbxIvrMenmu>,
    ) {
      super(repository);
    }

    async getIVRByNumber(tenantId: number, number: string) {
      try {
          const doc = await this.findOne({
              tenantId: tenantId,
              ivrNumber: number
          });
          return Promise.resolve(doc);
      }
      catch (ex) {
          return Promise.reject(ex);
      }
  }
  }
