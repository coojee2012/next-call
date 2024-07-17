import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { PbxRecordFile } from '../entities/pbx_record_file';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PbxRecordFileService extends BaseService<PbxRecordFile> {
    constructor(@InjectRepository(PbxRecordFile) repository: Repository<PbxRecordFile>) {
      super(repository);
    }
    hangupCall(data:any) {
      
    }
    transferStatic(data:any) {
      
    }
  }
