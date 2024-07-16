import { Module,DynamicModule } from '@nestjs/common';
import { EslService } from './esl.service';
import { EventService } from './event/event.service';
import { RedisService } from './redis/redis.service';


@Module({
  providers: [EslService, EventService, RedisService],
  exports: [
		EslService,
	],
})
export class EslModule {}
