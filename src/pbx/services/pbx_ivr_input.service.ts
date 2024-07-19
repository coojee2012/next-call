import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxIvrInput } from '../entities/pbx_ivr_input';
@Injectable()
export class PbxIvrInputService extends BaseService<PbxIvrInput> {
  constructor(
    @InjectRepository(PbxIvrInput) repository: Repository<PbxIvrInput>,
  ) {
    super(repository);
  }
  async getIvrInput(tenantId: number, ivrNumber: string, input: string) {
    try {
      const doc = await this.findOne({
        tenantId: tenantId,
        ivrNumber: ivrNumber,
        inputNumber: input,
      });
      return Promise.resolve(doc);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
