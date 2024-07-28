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
      const queue = await this.queueRepository.createQueryBuilder('queue')
      .leftJoinAndSelect("queue.queueOption", "queueOption")
      .leftJoinAndSelect("queue.agentOption", "agentOption")
      .where("queue.tenantId=:tenantId and queue.queueNumber=:queueNumber",{tenantId,queueNumber})
      .getOne();
      // return this.queueRepository.findOneBy({
      //   tenantId: tenantId,
      //   queueNumber: queueNumber,
      // });
      return queue;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
