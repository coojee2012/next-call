import { Module,DynamicModule } from '@nestjs/common';
import { EslService } from './esl.service';
import { EventService } from './event/event.service';
import { RedisService } from './redis/redis.service';
import { PbxModule } from 'src/pbx/pbx.module';
import { FlowBaseService } from './flow-base.service';
import { IvrService } from './ivr.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { TenantModule } from 'src/tenant/tenant.module';
import { RuntimeDataService } from './runtime-data.service';
import { CcqueueService } from './ccqueue.service';
import { QueueWorkerService } from './queue-worker.service';


@Module({
  imports:[PbxModule, TenantModule],
  providers: [EslService, EventService, RedisService, FlowBaseService, IvrService, FreeSwitchPbxService, RuntimeDataService, CcqueueService, QueueWorkerService],
  exports: [
		EslService,
	],
})
export class EslModule {}
