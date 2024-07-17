import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxFsHost } from '../entities/pbx_fs_host';

@Injectable()
export class PbxFsHostService  extends BaseService<PbxFsHost> {
    constructor(@InjectRepository(PbxFsHost) repository: Repository<PbxFsHost>) {
      super(repository);
    }}
