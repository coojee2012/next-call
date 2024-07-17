import { Injectable } from '@nestjs/common';
import { PbxExtensionn } from '../entities/pbx_extensionn';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class PbxExtensionnService extends BaseService<PbxExtensionn> {
  constructor(@InjectRepository(PbxExtensionn) repository: Repository<PbxExtensionn>) {
    super(repository);
  }
  async checkAgentCanDail(
    tenantId: number,
    member: string,
  ): Promise<PbxExtensionn> {
    return new PbxExtensionn();
  }

  async setAgentState(tenantId: number, agentNumber: string, state: string) {}

  async setAgentLastCallId(
    tenantId: number,
    accountCode: string,
    callId: string,
  ) {}
}
