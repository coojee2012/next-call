import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxBlackList } from '../entities/pbx_black_list';

@Injectable()
export class PbxBlackListService extends BaseService<PbxBlackList> {
  constructor(
    @InjectRepository(PbxBlackList) repository: Repository<PbxBlackList>,
  ) {
    super(repository);
  }
  async isBlackNumber(tenantId: number, checkNumber: string): Promise<boolean> {
    return false;
  }
}
