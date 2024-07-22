import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxRouter, RouterLineType } from '../entities/pbx_router';
@Injectable()
export class PbxRouterService extends BaseService<PbxRouter> {
    constructor(
      @InjectRepository(PbxRouter) repository: Repository<PbxRouter>,
    ) {
      super(repository);
    }
    async getRouterByTenantId(tenantId: number, routerLine: RouterLineType) {
      try {
          const routeDocs = await this.findBy({
              tenantId: tenantId,
              routerLine: routerLine
          });

          return Promise.resolve(routeDocs);
      } catch (ex) {
          return Promise.reject(ex);
      }
  }
  }
