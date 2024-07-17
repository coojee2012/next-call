import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PbxQueue } from '../entities/pbx_queue';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';

@Injectable()
export class PbxQueueService extends BaseService<PbxQueue> {
  constructor(
    @InjectRepository(PbxQueue)
    private queueRepository: Repository<PbxQueue>,
  ) {
    super(queueRepository);
  }
  async getQueue(
    tenantId: number,
    queueNumber: string,
  ): Promise<PbxQueue | null> {
    try {
      return this.queueRepository.findOneBy({
        tenantId: tenantId,
        queueNumber: queueNumber,
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
