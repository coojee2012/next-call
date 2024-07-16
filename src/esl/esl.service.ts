import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { FreeSwitchServer } from './NodeESL/Server';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EventService } from './event/event.service';
import { RedisService } from './redis/redis.service';
import { Connection } from './NodeESL/Connection';
import {Event} from './NodeESL/Event'

@Injectable()
export class EslService {
    eslServer: FreeSwitchServer;
    constructor(
        private readonly configService: ConfigService,
        private readonly logger:LoggerService,
        private readonly eventService: EventService, 
        private redisService: RedisService,
        private eventEmitter: EventEmitter2) {
            this.logger.setContext(EslService.name);
    }
   

    async readyRedisClients() {
        try {
            this.redisService.setNamePrefix('ESL');
            await this.redisService.addClient(10, 'BullQueue');
            await this.redisService.addClient(11, 'RedLock');
            await this.redisService.addClient(12, 'PUB');
            await this.redisService.addClient(12, 'SUB');
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    }



    async startOutbound() {
        try {
         
            await this.readyRedisClients();

            this.eslServer = new FreeSwitchServer(this.configService.get("fsOutbound"));

    
            this.eventService.initRedisSub();

            this.eventService.addARedisSub('stopFindAgent');
            this.eventService.addARedisSub('esl::callcontrol::queue::finded::member');

            // this.queueWorker = this.injector.get(QueueWorkerService);
            // await this.queueWorker.init();
            // await this.queueWorker.readyCacheBullQueue(); // 从缓存中恢复在使用的队列
            // const res = await this.eslServer.createOutboundServer();
            // this.logger.info(null,'[startOutbound]', res);
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
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    }


    async startInbound() {
        try {
            await this.readyRedisClients();
            this.eslServer = new FreeSwitchServer(this.configService.get("fsInbound"));

            this.eventService.initRedisSub();

            this.eventService.addARedisSub('stopFindAgent');
            this.eventService.addARedisSub('esl::callcontrol::queue::finded::member');

            // this.queueWorker = this.injector.get(QueueWorkerService);
            // await this.queueWorker.init();
            // await this.queueWorker.readyCacheBullQueue(); // 从缓存中恢复在使用的队列


            const conn = await this.eslServer.createInboundServer();
            const calls: string[] = [];

            // setInterval(() => {
            //     conn.api('sofia', ['status', 'profile', 'internal', 'reg'], (evt: Event) => {
            //         const value: string = evt.body;
            //         this.logger.debug('REG:', value);
            //     });
            // }, 5000)

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
                    this.logger.debug(null,'拨打队列成员');
                }
                else if (calls.indexOf(callId) < 0) {
                    calls.push(callId);
                    this.inboundHandleCall(conn, evt)
                        .then()
                        .catch()
                }
                else {

                }
            })
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    }


    async onEslConnOpen(conn: Connection, id: string) {
        try {

            this.logger.debug(`onEslConnOpen->${id}:`, conn.getInfo());
        } catch (ex) {
            this.logger.error('onEslConnOpen Error:', ex);
        }
    }

    async onEslConnReady(conn: Connection, id: string) {
        try {
            const connEvent: Event = conn.getInfo();
            this.logger.debug(`onEslConnReady->${id}:`, connEvent.getHeader('Unique-ID'));
            if (conn.isInBound()) {

            } else {
                await this.handleOutbound(conn, id);
            }

        } catch (ex) {
            this.logger.error('onEslConnReady Error:', ex);
        }
    }

    async onEslConnClose(conn: Connection, id: string) {
        try {
            const connEvent: Event = conn.getInfo();
            this.logger.debug(`onEslConnClose->${id}:`, connEvent.getHeader('Unique-ID'));
            this.eventEmitter.emit(`esl:conn::close::${id}`, connEvent.getHeader('Unique-ID'));
        } catch (ex) {
            this.logger.error('onEslConnClose Error:', ex);
        }
    }

    async handleOutbound(conn: Connection, id: string) {
        try {
            // const fsCallFlow = new FreeSwitchCallFlow(this.injector, conn);
            // this.eventEmitter.once(`esl:conn::close::${id}`, (callId) => {
            //     this.logger.info(null,`esl conn ${id} has closed yet!callId is ${callId}!`);
            //     fsCallFlow.end()
            //         .then(() => {

            //         })
            //         .catch(err => {

            //         })
            // })
            // this.handleAgentEvents(fsCallFlow);
            // const result = await fsCallFlow.start();
            // this.logger.info(`${id} handle result:`, result);
        } catch (ex) {
            this.logger.error('handleOutbound Error:', ex);
            return Promise.reject(ex);
        }
    }

    async inboundHandleCall(conn: Connection, initEvent: Event) {
        try {
            this.logger.info(null,'New Call In Comming......');
            // const fsCallFlow = new FreeSwitchCallFlow(this.injector, conn, initEvent);
            // this.handleAgentEvents(fsCallFlow);
            // const result = await fsCallFlow.start();
            //this.logger.info(`Inbound handle call result:`, result);
        } catch (ex) {
            this.logger.error('inboud handle call error:', ex);
            return Promise.reject(ex);
        }
    }



    handleAgentEvents(fsCallFlow: any) {
        try {
            // const agentEvents = this.eslEventNames.ESLUserEvents;
            // Object.keys(agentEvents)
            //     .forEach(key => {
            //         this.eventEmitter.on(agentEvents[key], (...args) => {
            //             fsCallFlow.emit(`${agentEvents[key]}::${fsCallFlow.getCallId()}`, args);
            //         })
            //     })
        } catch (ex) {
            this.logger.error('handle agent events error:', ex);
        }
    }
}
