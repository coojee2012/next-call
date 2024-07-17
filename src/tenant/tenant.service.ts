import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BaseService } from 'src/common/BaseService';
import { Tenant } from './entities/tenant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TenantService extends BaseService<Tenant> {
  constructor(@InjectRepository(Tenant) repository: Repository<Tenant>) {
    super(repository);
  }


  remove(id: number) {
    return `This action removes a #${id} tenant`;
  }
  getTenantByDomain(domian: string) {

  }
  getDialGateWay(data:any): { dnd:string, gateway:string } {
    return { dnd:'', gateway:'' }
  }
}
