import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { RedisService } from '../redis/redis.service';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventService {
  private redisPubClient: Redis | null;
  private redisSubClient: Redis | null;
  private msg_count: number;

  constructor(
    private logger: LoggerService,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    this.logger.debug('EventService', 'Init Runtime Data!');
  }

  initRedisPub() {
    try {
      this.redisPubClient = this.redisService.getClientByName('PUB');
      if (!this.redisPubClient) {
        throw new Error('Redis PUB client is null!');
      }
    } catch (ex) {
      this.logger.error('EventService', 'initRedisPub Error:', { ex });
    }
  }

  initRedisSub() {
    try {
      this.redisSubClient = this.redisService.getClientByName('SUB');
      if (this.redisPubClient) {
        this.msg_count = 0;
        this.redisSubClient?.on('subscribe', (channel, count) => {
          this.logger.info(
           'EventService', 
            `subscribe ${channel} success,total subscribe ${count} channels`,
          );
        });

        this.redisSubClient?.on('unsubscribe', (channel, count) => {
          this.logger.info(
            'EventService', 
            `unsubscribe ${channel} success,total subscribe ${count} channels`,
          );
        });

        this.redisSubClient?.on('message', (channel, message) => {
          this.logger.info(
            'EventService', 
            `sub channel:[${channel}],total: ${this.msg_count},message:`,
            {message},
          );
          this.msg_count += 1;
          try {
            let msgObj = JSON.parse(message);
            const toEmitEventName = `${channel}::${msgObj.tenantId}::${msgObj.callId}`;
            this.logger.debug('EventService', `${toEmitEventName}`, {msgObj});
            this.eventEmitter.emit(toEmitEventName, msgObj);
            msgObj = null;
          } catch (ex) {
            this.logger.error('EventService','Done RedisSub Error:', {ex});
          }
        });
      } else {
        throw new Error('Redis SUB client is null!');
      }
    } catch (ex) {
      this.logger.error('EventService',' initRedisSub Error:', {ex});
    }
  }

  async addARedisSub(eventName: string) {
    try {
      const count = await this.redisSubClient?.subscribe(eventName);
      this.logger.debug('EventService', `Has Add ${count} Redis Sub!`);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
  async pubAReidsEvent(eventName: string, data: string) {
    try {
      await this.redisPubClient?.publish(eventName, data);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
