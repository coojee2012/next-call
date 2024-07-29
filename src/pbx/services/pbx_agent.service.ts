import { Injectable } from '@nestjs/common';
import { PbxAgent } from '../entities/pbx_agent';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class PbxAgentService extends BaseService<PbxAgent> {
  constructor(@InjectRepository(PbxAgent) repository: Repository<PbxAgent>) {
    super(repository);
  }
  async getRoundRobinAgents(
    tenantId: number,
    queueNumber: string,
  ): Promise<PbxAgent[]> {
    const sort: { lastBridgeStart: number; position: number } = {
      lastBridgeStart: -1,
      position: -1,
    };
    const agents = await this.repository.find({
      where: {
        tenantId,
        queueNumber,
      },
      order: {
        lastBridgeStart: 'DESC',
        position: 'DESC',
      },
    });
    if (agents.length > 0) {
      return agents;
    }
    return [];
  }
  newCall(data: any) {}
  answerCall(data: any) {}
  noAnsweredCall(data: any) {}
}
