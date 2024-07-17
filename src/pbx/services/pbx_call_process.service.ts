import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PbxCallProcess } from '../entities/pbx_call_process';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
@Injectable()
export class PbxCallProcessService extends BaseService<PbxCallProcess> {
    constructor(@InjectRepository(PbxCallProcess) repository: Repository<PbxCallProcess>) {
      super(repository);
    }
}
