import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxLastService } from '../entities/pbx_last_service';
@Injectable()
export class PbxLastServiceService extends BaseService<PbxLastService> {
    constructor(
      @InjectRepository(PbxLastService) repository: Repository<PbxLastService>,
    ) {
      super(repository);
    }
  }
