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
    async getLocalByNumber(tenantId: number, localNumber: string) {
      try {
          const localNumberDoc = await this.findOne({
              tenantId: tenantId,
              number: localNumber
          });
              
          if(localNumberDoc){
              return Promise.resolve(localNumberDoc);
          }else{
              return Promise.reject(`Can't find localNumber <${localNumber}> for <${tenantId}>!`);
          }
         

      } catch (ex) {
          return Promise.reject(ex);
      }
  }
  }

