import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxIvrActions } from '../entities/pbx_ivr_actions';
@Injectable()
export class PbxIvrActionsService extends BaseService<PbxIvrActions> {
  constructor(
    @InjectRepository(PbxIvrActions) repository: Repository<PbxIvrActions>,
  ) {
    super(repository);
  }
  async getIvrAction(tenantId: number, ivrNumber:string, ordinal:number): Promise<any> {

  }
}
