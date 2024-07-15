import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly logger: LoggerService,
      ) {
        this.logger.setContext(TasksService.name);
      }

    @Cron('45 * * * * *', {
        name: 'core',
    })
    handleCron() {
      //this.logger.debug(null, 'Called when the second is 45');
    }
  
    @Interval(10000)
    handleInterval() {
      //this.logger.debug(null, 'Called every 10 seconds');
    }
  
    @Timeout(5000)
    handleTimeout() {
      //this.logger.debug(null, 'Called once after 5 seconds');
    }
}
