import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxRouter } from '../entities/pbx_router';
@Injectable()
export class PbxRouterService extends BaseService<PbxRouter> {
    constructor(
      @InjectRepository(PbxRouter) repository: Repository<PbxRouter>,
    ) {
      super(repository);
    }
  }
