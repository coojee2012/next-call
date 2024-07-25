import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { FreeSwitchServer } from './NodeESL/Server';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EventService } from './event/event.service';
import { RedisService } from './redis/redis.service';
import { Connection } from './NodeESL/Connection';
import { Event } from './NodeESL/Event';
import { QueueWorkerService } from './queue-worker.service';
import {
  ESLUserEvents,
  FreeSwitchCallFlowService,
} from './free-switch-call-flow.service';

@Injectable()
export class EslService {
  eslServer: FreeSwitchServer;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly eventService: EventService,
    private redisService: RedisService,
    private queueWorker: QueueWorkerService,
    private eventEmitter: EventEmitter2,
    private callFlowService: FreeSwitchCallFlowService,
  ) {
    this.logger.setContext(EslService.name);
    this.initServer()
      .then((res) => {
        this.logger.info('EslService', 'Init OK!');
      })
      .catch((error) => {
        this.logger.info('EslService', 'Init Error!', error);
      });
  }

  async initServer() {
    try {
      await this.readyRedisClients();
      this.eventService.initRedisSub();
      this.eventService.addARedisSub('stopFindAgent');
      this.eventService.addARedisSub('esl::callcontrol::queue::finded::member');
      await this.queueWorker.init();
      this.logger.info('EslService', 'QueueWork init OK');
      await this.queueWorker.readyCacheBullQueue(); // 从缓存中恢复在使用的队列
      this.logger.info('EslService', 'QueueWork Ready Cache Bull Queue OK!');
    } catch (error) {
      this.logger.error('EslService', 'initServer error', error);
    }
  }

  async readyRedisClients() {
    try {
      this.redisService.setNamePrefix('ESL');
      await this.redisService.addClient(10, 'BullQueue');
      await this.redisService.addClient(11, 'RedLock');
      await this.redisService.addClient(12, 'PUB');
      await this.redisService.addClient(12, 'SUB');
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async startOutbound() {
    try {
      this.eslServer = new FreeSwitchServer(
        this.configService.get('fsOutbound'),
      );
      const res = await this.eslServer.createOutboundServer();
      this.logger.info(null, '[Started Outbound]');
      /**
       * ESL连接打开
       */
      this.eslServer.on('connection::open', this.onEslConnOpen.bind(this));
      /**
       * ESL连接就绪
       */
      this.eslServer.on('connection::ready', this.onEslConnReady.bind(this));
      /**
       * ESL连接断开
       */
      this.eslServer.on('connection::close', this.onEslConnClose.bind(this));
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async startInbound() {
    try {
      this.eslServer = new FreeSwitchServer(
        this.configService.get('fsInbound'),
      );
      const conn = await this.eslServer.createInboundServer();
      const calls: string[] = [];
      const inboundHost = this.configService.get('fsInbound.host');
      setInterval(() => {
        conn.api(
          'sofia',
          ['status', 'profile', 'internal', 'reg'],
          (evt: Event) => {
            //const value: string = evt.body;
            //this.logger.debug('ESLService','REG:', {reg: value});
          },
        );
      }, 5000);

      // conn.on('esl::event::MESSAGE::**', (evt) => {

      //     this.fsChat.inboundHandleMsg(conn, evt)
      //         .then()
      //         .catch(err => {

      //         })

      // })

      conn.on('esl::event::CHANNEL_PARK::**', (evt) => {
        const callId = evt.getHeader('Unique-ID');
        const isDialQueueMember = evt.getHeader('variable_dial_queuemember');
        if (isDialQueueMember === 'yes') {
          this.logger.debug(null, '拨打队列成员');
        } else if (calls.indexOf(callId) < 0) {
          calls.push(callId);
          this.inboundHandleCall(conn, inboundHost, evt).then().catch();
        } else {
        }
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async onEslConnOpen(conn: Connection, id: string) {
    try {
      this.logger.debug('ESLService', `onEslConnOpen->${id}:`, conn.getInfo());
    } catch (ex) {
      this.logger.error('ESLService', 'onEslConnOpen Error:', {error: ex});
    }
  }

  async onEslConnReady(conn: Connection, id: string) {
    try {
      const connEvent: Event = conn.getInfo();
      this.logger.debug(
        `onEslConnReady->${id}:`,
        connEvent.getHeader('Unique-ID'),
      );
      if (conn.isInBound()) {
      } else {
        await this.handleOutbound(conn, id);
      }
    } catch (ex) {
      this.logger.error('ESLService', 'onEslConnReady Error:', {error: ex});
    }
  }

  async onEslConnClose(conn: Connection, id: string) {
    try {
      const connEvent: Event = conn.getInfo();
      this.logger.debug(
        `onEslConnClose->${id}:`,
        connEvent.getHeader('Unique-ID'),
      );
      this.eventEmitter.emit(
        `esl:conn::close::${id}`,
        connEvent.getHeader('Unique-ID'),
      );
    } catch (ex) {
      this.logger.error('onEslConnClose Error:', ex);
    }
  }

  async handleOutbound(conn: Connection, id: string) {
    try {
      this.eventEmitter.once(`esl:conn::close::${id}`, (callId) => {
        this.logger.info(
          null,
          `esl conn ${id} has closed yet!callId is ${callId}!`,
        );
        this.callFlowService
          .end(id)
          .then(() => {})
          .catch((err: any) => {});
      });
      this.handleAgentEvents(id);
      const result = await this.callFlowService.start(conn, id);
      this.logger.info('ESLService', `${id} handle result:`, { result });
    } catch (ex) {
      this.logger.error('ESLService', 'handleOutbound Error:', {error: ex});
      return Promise.reject(ex);
    }
  }

  async inboundHandleCall(
    conn: Connection,
    inboundHost: string,
    initEvent: Event,
  ) {
    try {
      this.logger.info(null, 'New Call In Comming......');
      const callId = initEvent.getHeader('Unique-ID');
      this.handleAgentEvents(inboundHost, callId);
      const result = await this.callFlowService.start(
        conn,
        inboundHost,
        initEvent,
      );
      this.logger.info('ESLService', `Inbound handle call result:`, { result });
    } catch (ex) {
      this.logger.error('ESLService', 'inboud handle call error:', {error: ex});
      return Promise.reject(ex);
    }
  }

  handleAgentEvents(conn_id: string, callId?: string) {
    try {
      for (const key in ESLUserEvents) {
        let emitStr = '';
        switch (key) {
          case 'hangup':
            emitStr = ESLUserEvents['hangup'];
            break;
          case 'holdOn':
            emitStr = ESLUserEvents['holdOn'];
            break;
          case 'holdOff':
            emitStr = ESLUserEvents['holdOff'];
            break;
          case 'blindTransfer':
            emitStr = ESLUserEvents['blindTransfer'];
            break;
          case 'appointTransfer':
            emitStr = ESLUserEvents['appointTransfer'];
            break;
          case 'loginQueue':
            emitStr = ESLUserEvents['loginQueue'];
            break;
          case 'logoffQueue':
            emitStr = ESLUserEvents['logoffQueue'];
            break;
        }
        this.eventEmitter.on(emitStr, (...args) => {
          if (!callId) {
            // outbound mode get callid form each call
            callId = this.callFlowService.getCallId(conn_id);
          }
          this.eventEmitter.emit(`${emitStr}::${callId}`, args);
        });
      }
    } catch (ex) {
      this.logger.error('ESLService','handle agent events error:', {error: ex});
    }
  }
}
