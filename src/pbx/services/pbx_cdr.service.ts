import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { PbxCdr } from '../entities/pbx_cdr';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PbxCdrService extends BaseService<PbxCdr> {
  constructor(@InjectRepository(PbxCdr) repository: Repository<PbxCdr>) {
    super(repository);
  }
  updateCalled(tenantId:number, callId:string, accountCode:string) {

  }
  setAgentId(data:any) {}
}
