import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from 'src/logger/logger.service';
import { EventService } from './event/event.service';
import { ConfigService } from '@nestjs/config';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { PbxCallProcessService } from 'src/pbx/services/pbx_call_process.service';
import { PbxCdrService } from 'src/pbx/services/pbx_cdr.service';
import { PbxRouterService } from '../pbx/services/pbx_router.service';
import { RuntimeDataService } from './runtime-data.service';
import { Connection } from './NodeESL/Connection';
import { Event } from './NodeESL/Event';
import { FlowBaseService } from './flow-base.service';
import { RouterLineType } from 'src/pbx/entities/pbx_router';
import { error } from 'console';

export enum ESLUserEvents {
    hangup = 'esl::user::hangup',
    holdOn = 'esl::user::hold::on',
    holdOff ='esl::user::hold::off',
    blindTransfer = 'esl::user::transfer::blind',
    appointTransfer ='esl::user::transfer::appoint',
    loginQueue = 'esl::user::queue::login',
    logoffQueue = 'esl::user::queue::logoff'
}

@Injectable()
export class FreeSwitchCallFlowService {
  constructor(
    private readonly logger: LoggerService,
    private eventEmitter: EventEmitter2,
    private eventService: EventService,
    private config: ConfigService,
    private fsPbx: FreeSwitchPbxService,
    private pbxCallprocessService: PbxCallProcessService,
    private pbxCdrService: PbxCdrService,
    private pbxRouterService: PbxRouterService,
    private runtimeData: RuntimeDataService,
    private flowBase: FlowBaseService
  ) {}

  /**
   * @description 启动电话逻辑处理流程
   */
  async start(conn: Connection, conn_id: string, initEvent?:Event) {
    try {
      let callId = initEvent?.getHeader('Unique-ID');
      

      this.runtimeData.initData(conn, conn_id, initEvent)  
      callId = this.runtimeData.getCallId(conn_id);
      this.logger.debug('FreeSwitchCallFlowService','Begin Call Flow!', {callId: callId});
      // 没有租户的用户是非法的用户
      await this.runtimeData.setTenantInfo(conn_id);
      if (!conn.isInBound()) {
        conn.on('esl::event::disconnect::notice', (event: Event) => {
          const disposition = event.getHeader('Content-Disposition');
          if (disposition === 'linger') {
            const lingerTime = event.getHeader('Linger-Time');
            this.logger.warn('FreeSwitchCallFlowService',`ESL Conn will disconnect after:${lingerTime}s`);
          } else {
            this.logger.debug('FreeSwitchCallFlowService',`ESL Conn is disconnecting!!!`);
          }
        });
        // 当A-leg结束之后，还允许esl socket驻留的最长时间s
        await this.fsPbx.linger(conn_id, 30);
        const subRes = await this.fsPbx.subscribe(conn_id, ['ALL']);
        await this.fsPbx.filter(conn_id, 'Unique-ID', callId);
        await this.fsPbx.filter(conn_id, 'Other-Leg-Unique-ID', callId);
      }

      await this.billing(conn_id);
      this.listenAgentEvent(callId);
      await this.route(conn_id, callId);
      await this.fsPbx.uuidTryKill(conn_id, callId);
      this.logger.debug('FreeSwitchCallFlowService','Call Flow Exec END!');
    } catch (ex) {
      this.logger.error('FreeSwitchCallFlowService','In Call Flow Sart', {error: ex});
    }
  }

  async end(conn_id:string) {
    try {
        
    } catch (ex) {}
  }

  /**
   * @description 开始计费
   * 关于计费的设计：
   * 1、每一条leg单独计费，计费从该leg应答到该leg结束为止
   * 2、计费金额在通话结束时写入记录到cdr中，并扣除租户通话余额（后期可以每分钟计费一次，当话费不足以支付（包含允许欠费的最大值）时，主动结束通话）
   *
   */
  async billing(conn_id: string) {
    try {
      const { tenantId, callId, caller, callee, routerLine } =
        this.runtimeData.getRunData(conn_id);
      const { sipCallId, channelName, useContext } =
        this.runtimeData.getChannelData(conn_id);
      await this.pbxCdrService.createCdr({
        tenantId: tenantId,
        routerLine: routerLine,
        srcChannel: channelName,
        context: useContext,
        caller: caller,
        called: callee,
        callId: callId,
        agiType: 'a-leg',
        isClickOut: false,
        recordCall: true,
        sipCallId,
        isTransfer: false,
        associateId: [],
      });

      const callProcessData = {
        tenantId: tenantId,
        callId: callId,
        caller: caller,
        called: callee,
        processName: 'billing',
        passArgs: {},
      };
      await this.pbxCallprocessService.create(callProcessData);
    } catch (ex) {
      
      return Promise.reject(ex);
    }
  }

  // 监听坐席电话条发起的事件：如挂机，保持等事件
  listenAgentEvent(callId:string) {
    try {
      this.eventEmitter.once(
        `${ESLUserEvents.hangup}::${callId}`,
        this.onAgentHangup.bind(this),
      );
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  removeAllAgentListener(callId: string) {
    try {
      this.eventEmitter.removeAllListeners(`${ESLUserEvents.hangup}::${callId}`);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async onAgentHangup() {
    try {
    } catch (ex) {}
  }

  /**
   * @description 通过主叫和被叫号码从数据库中获取匹配的路由规则
   *
   * */
  async getRoute(conn_id: string) {
    try {
      const { tenantId, routerLine, callId } = this.runtimeData.getRunData(conn_id);
      let { caller: caller, callee: called } = this.runtimeData.getRunData(conn_id);
      this.logger.debug('FreeSwitchCallFlowService', 'getRoute', {caller,called,routerLine})
      const result : any = {
        processmode: '',
        processdefined: null,
        routerLine: '',
        match: false,
        matchFailError: '',
      };
      const routeDocs = await this.pbxRouterService.getRouterByTenantId(
        tenantId,
        routerLine as RouterLineType,
      );
      for (let i: number = 0; i < routeDocs.length; i++) {
        let doc = routeDocs[i];
        this.logger.debug('FreeSwitchCallFlowService','循环去匹配找到的路由规则：', {routerName: doc.routerName});
        if (!result.match) {
          if (doc.callerGroup === 'all') {
            this.logger.debug('FreeSwitchCallFlowService',
              '开始进行呼叫路由判断,主叫:' +
              caller + 
              ',被叫:' +
              called,
            );
            result.match = true;
            let reCaller = new RegExp('^' + doc.callerId);
            let reCalled = new RegExp('^' + doc.calledNum);

            // _this.db.cdrSetRouterLine(doc.routerLine, 'Router');

            if (doc.routerLine === '呼入') {
              //匹配主叫以什么号码开头
              if (doc.callerId && caller && !reCaller.test(caller)) {
                result.match = false;
              }
              //匹配主叫号码长度
              if (doc.callerLen > 0 && caller && caller.length !== doc.callerLen) {
                result.match = false;
              }
              //匹配被叫开头
              if (doc.calledNum && called && !reCalled.test(called)) {
                result.match = false;
              }
              //匹配被叫长度
              if (doc.calledLen > 0 && called && called.length !== doc.calledLen) {
                result.match = false;
              }
            } else if (doc.routerLine === '呼出') {
              //匹配被叫以什么号码开头
              if (doc.calledNum && called &&  !reCalled.test(called)) {
                result.match = false;
              }
              //匹配被叫长度
              if (doc.calledLen > 0 && called && called.length !== doc.calledLen) {
                result.match = false;
              }
              // _this.R.agentId = await _this.R.service.extension.getAgentId(_this.R.tenantId, _this.R.caller);
              // _this.db.cdrSetAgentId(_this.R.agentId, 'Router');
            } else if (doc.routerLine === '本地') {
              //匹配被叫以什么号码开头
              if (doc.calledNum && called && !reCalled.test(called)) {
                result.match = false;
              }
              //匹配被叫长度
              if (doc.calledLen > 0 && called && called.length !== doc.calledLen) {
                result.match = false;
              }
              // _this.R.agentId = await _this.R.service.extension.getAgentId(_this.R.tenantId, _this.R.caller);
              // _this.db.cdrSetAgentId(_this.R.agentId, 'Router');
            } else {
              //其他情况
              result.match = false;
              result.matchFailError = `未知的routerLine${doc.routerLine}`;
            }
            result.routerLine = doc.routerLine;
            //匹配成功后，对主叫和被叫进行替换
            if (result.match) {
              //主叫替换
              this.logger.debug('FreeSwitchCallFlowService','路由匹配成功，开始进行替换操作!');
              if (doc.replaceCallerId !== '') {
                caller = doc.replaceCallerId;
              }
              //删除被叫前几位
              if (doc.replaceCalledTrim > 0) {
                called = called?.substr(doc.replaceCalledTrim);
              }
              //补充被叫前几位
              if (doc.replaceCalledAppend !== '') {
                called = doc.replaceCalledAppend + called;
              }
              result.processmode = doc.processMode;
              if (result.processmode === 'dialout') {
                result.processdefined = doc.processedFined;
              } else if (result.processmode === 'dialpbxlocal') {
                result.processdefined = doc.processedFined;
              } else if (result.processmode === 'dialoutNewRock') {
                result.processdefined = doc.processedFined;
              } else {
                result.processmode = 'diallocal';
                if (routerLine === '本地') {
                  result.processdefined = called;
                } else if (routerLine === '呼入') {
                  result.processdefined = doc.processedFined || '200';
                } else {
                  result.processdefined = doc.processedFined;
                }
              }
              //callProcessData.passArgs.routerName = doc.routerName;
              //callProcessData.passArgs.match = true;
              //callProcessData.passArgs.processmode = result.processmode;
              //callProcessData.passArgs.processedFined = result.processedFined;
              break;
            }
          }
        }
      }
      if (!result.match) {
        this.logger.debug('FreeSwitchCallFlowService','路由匹配失败，进行默认设置处理!');
        if (called === '100') {
          result.processmode = 'diallocal';
          result.processdefined = '200';
        } else {
          result.matchFailError = '未找到适合的路由!';
        }
      }
      const callProcessData = {
        tenantId: tenantId,
        callId: callId,
        caller: caller,
        called: called,
        processName: 'route',
        passArgs: {
          match: false,
          routerName: '',
          processmode: result.processmode,
          processedFined: result.processdefined,
        },
      };
      await this.pbxCallprocessService.create(callProcessData);
      this.logger.debug('FreeSwitchCallFlowService','Route Result:', result);
      return Promise.resolve(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
  /**
   * @description 开始路由处理
   */
  async route(conn_id:string, callId: string) {
    try {
      
      let { processmode, processdefined, routerLine } = await this.getRoute(conn_id);
      this.logger.debug('FreeSwitchCallFlowService',`route->callId:`, {callId,routerLine,processmode,processdefined});
      switch (processmode) {
        case 'diallocal':
          // result = await _this.flowBase.dialLocal(processdefined);
          //_this.R.logger.debug('FreeSwitchCallFlowService',loggerPrefix.concat(['route']), 'diallocal result:', result);
          await this.flowBase.diallocal(conn_id, processdefined);
          break;
        case 'dialout':
          // result = await _this.flowBase.dialOut(_this.R.called, processdefined);
          //_this.R.logger.debug('FreeSwitchCallFlowService',loggerPrefix.concat(['route']), 'dialout result:', result);
          //await _this.wait(3000);
          break;
        case 'dialpbxlocal':
          // result = await _this.flowBase.dialPbxLocal(_this.R.called, processdefined);
          //_this.R.logger.debug('FreeSwitchCallFlowService',loggerPrefix.concat(['route']), 'dialpbxlocal result:', result);
          break;
        case 'dialoutNewRock':
          //result = await _this.flowBase.dialoutNewRock(_this.R.called, processdefined);
          // _this.R.logger.debug('FreeSwitchCallFlowService',loggerPrefix.concat(['route']), 'dialoutNewRock result:', result);
          break;
        case 'blacklist':
          // result = await _this.flowBase.blackList();
          break;
        default:
          // result = await _this.defaultRoute();
          break;
      }
    } catch (ex) {
      this.logger.debug('FreeSwitchCallFlowService', 'route', {ex})
      await this.fsPbx.uuidTryKill(conn_id, callId);
      return Promise.reject(ex);
    }
  }

  getCallId(conn_id:string): string {
    return this.runtimeData.getCallId(conn_id);
  }
}
