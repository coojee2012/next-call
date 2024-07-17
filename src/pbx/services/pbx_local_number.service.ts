import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxLocalNumber } from '../entities/pbx_local_number';
@Injectable()
export class PbxLocalNumberService extends BaseService<PbxLocalNumber> {
    constructor(
      @InjectRepository(PbxLocalNumber) repository: Repository<PbxLocalNumber>,
    ) {
      super(repository);
    }
  }

