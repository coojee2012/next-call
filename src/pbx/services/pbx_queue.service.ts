import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PbxQueue } from '../entities/pbx_queue';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { PbxQueueAgentOption } from '../entities/pbx_queue_agent_option';
import { PbxQueueOption } from '../entities/pbx_queue_option';
import { PbxQueueMemberService } from './pbx_queue_member.service';
@Injectable()
export class PbxQueueService extends BaseService<PbxQueue> {
  constructor(
    @InjectRepository(PbxQueue)
    private queueRepository: Repository<PbxQueue>,
    @InjectRepository(PbxQueueAgentOption)
    private readonly queueAgentOptionRepository: Repository<PbxQueueAgentOption>,
    @InjectRepository(PbxQueueOption)
    private readonly queueOptionRepository: Repository<PbxQueueOption>,
    private readonly queueMemberService: PbxQueueMemberService,
    
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

  async createNewAgentOption(): Promise<PbxQueueAgentOption> {
    try {
      const agentOption = new PbxQueueAgentOption();
      return await this.queueAgentOptionRepository.save(agentOption);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async createNewQueueOption(): Promise<PbxQueueOption> {
    try {
      const queueOption = new PbxQueueOption();
      return await this.queueOptionRepository.save(queueOption);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async updateMembers(queueId:number, queueNumber:string, tenantId:number, members:string[]):Promise<PbxQueue | null>{
    try{
      const queue = await super.updateOne({id:queueId,tenantId}, {members});
      await this.queueMemberService.deleteBy({queueNumber,tenantId})
      await this.queueMemberService.batchCreate(queueNumber,tenantId,members)
      return queue;
    }catch(ex){
      return Promise.reject(ex);
    }
  }
}
