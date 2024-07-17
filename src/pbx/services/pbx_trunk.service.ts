import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxTrunk } from '../entities/pbx_trunk';
@Injectable()
export class PbxTrunkService extends BaseService<PbxTrunk> {
    constructor(
      @InjectRepository(PbxTrunk) repository: Repository<PbxTrunk>,
    ) {
      super(repository);
    }
  }
