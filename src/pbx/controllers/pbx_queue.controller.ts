import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { PbxQueueService } from '../services/pbx_queue.service';
import { PbxQueue } from '../entities/pbx_queue';

@Controller('pbx/queue')
@UseInterceptors(ClassSerializerInterceptor)
export class PbxQueueController {
  constructor(private readonly pbxQueueService: PbxQueueService) {}
  @Get()
  async getList(
    @Req() req: Request,
    @Query('searchKey') searchKey: string,
  ): Promise<PbxQueue[]> {
    const user = req.user as any;
    const { tenantId } = user;
    return await this.pbxQueueService.listSearch(
      searchKey,
      ['queueNumber', 'queueName'],
      { tenantId },
    );
  }
  @Post()
  async create(@Req() req: Request, @Body() body: any): Promise<PbxQueue> {
    const user = req.user as any;
    const { tenantId } = user;
    const { queueName, queueNumber, description } = body;
    const queueOption = await this.pbxQueueService.createNewQueueOption();
    const agetOption = await this.pbxQueueService.createNewAgentOption();
    const pbxQueue = await this.pbxQueueService.create({
      tenantId,
      queueName,
      queueNumber,
      queueOptionId: queueOption.id,
      agentOptionId: agetOption.id,
      description,
    });
    return pbxQueue;
  }
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<PbxQueue | null> {
    const user = req.user as any;
    const { tenantId } = user;
    const { queueName, description } = body;
    const pbxQueue = await this.pbxQueueService.updateOne(
      { id: +id, tenantId },
      { queueName, description },
    );
    return pbxQueue;
  }

  @Put(':id/members')
  async updateMembers(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<PbxQueue | null> {
    const user = req.user as any;
    const { tenantId } = user;
    const { members, queueNumber } = body;
    const pbxQueue = await this.pbxQueueService.updateMembers(
      +id,
      queueNumber,
      tenantId,
      members,
    );
    return pbxQueue;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string): Promise<number> {
    const user = req.user as any;
    const { tenantId } = user;
    return await this.pbxQueueService.deleteBy({ id: +id, tenantId });
  }
}
