import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { TenantService } from 'src/tenant/tenant.service';
import { Connection } from './NodeESL/Connection';
import { Event } from './NodeESL/Event';

export interface IChannelData {
  FSName?: string;
  CoreUuid?: string;
  DestinationNumber?: string;
  CallDirection?: string;
  originateCallee?: string;
  callerId?: string;
  callerName?: string;
  calleeId?: string;
  calleeName?: string;
  sipCallId?: string;
  channelName?: string;
  useContext?: string;
  callType?: string;
  originateCall?: string;
  originateTenant?: string;
  sipHReferredBy?: string;
  sipReferTo?: string;

  transferHistory?: string;
  transferSource?: string;

  maxForwards?: string;
  ivrTransfer?: string;
  clickOut?: string;
  clickAgent?: string;
}

export interface IRunData {
  callId: string;
  ivrMaxDeep: number;
  ivrCurrentDeep: number;
  tenantId: number;
  caller?: string;
  callee?: string;
  isOriginateCall?: boolean;
  routerLine?: string;
  answered?: boolean;
  hangupBy?: string;
  transferCall?: boolean;
}
export interface ISatisData {
  hangup?: any;
  agentId?: number;
  sType?: string;
  agentNumber?: string;
  queueNumber?: string;
  queueName?: string;
  hangupCase?: string;
  answerTime?: number;
  ringTime?: number;
  agentLeg?: string;
}

@Injectable()
export class RuntimeDataService {
  private channelData: { [key: string]: IChannelData } = {};
  private runData: { [key: string]: IRunData } = {};
  private statisData: { [key: string]: ISatisData } = {};
  private tenantInfo: { [key: string]: any } = {};
  private blegIds: string[];
  private blegUsers: string[]; //可以使用extension,外线号码
  private connections: { [key: string]: Connection } = {};
  private connEvents: { [key: string]: Event } = {};
  constructor(
    private readonly logger: LoggerService,
    private tenantService: TenantService,
  ) {
    this.blegIds = [];
    this.blegUsers = [];
  }
  initData(conn: Connection, conn_id: string, connEvent?: Event) {
    this.connections[conn_id] = conn;
    const isInbound = conn.isInBound();
    this.logger.info('RuntimeDataService', 'isInbound', { isInbound });
    if (!isInbound) {
      connEvent = conn.getInfo();
    }
    this.channelData[conn_id] = {};
    this.runData[conn_id] = {
      tenantId:0,
      callId: '',
      ivrMaxDeep: 100,
      ivrCurrentDeep: 0
    };
    if (connEvent) {
      this.connEvents[conn_id] = connEvent;

      this.logger.debug('RuntimeDataService', 'Init Runtime Data!');
      
      this.channelData[conn_id].FSName = connEvent.getHeader(
        'FreeSWITCH-Switchname',
      );
      this.channelData[conn_id].CoreUuid = connEvent.getHeader('Core-UUID');
      this.channelData[conn_id].CallDirection =
        connEvent.getHeader('Call-Direction');
      this.channelData[conn_id].callerId = connEvent.getHeader(
        'Caller-Caller-ID-Number',
      );
      this.channelData[conn_id].callerName = connEvent.getHeader(
        'Caller-Caller-ID-Name',
      );
      this.channelData[conn_id].calleeId = connEvent.getHeader(
        'Caller-Callee-ID-Number',
      );
      this.channelData[conn_id].calleeName = connEvent.getHeader(
        'Caller-Callee-ID-Name',
      );
      this.channelData[conn_id].DestinationNumber = connEvent.getHeader(
        'Caller-Destination-Number',
      );
      this.channelData[conn_id].sipCallId = connEvent.getHeader(
        'variable_sip_call_id',
      );
      this.channelData[conn_id].channelName = connEvent.getHeader(
        'Caller-Channel-Name',
      );
      this.channelData[conn_id].useContext =
        connEvent.getHeader('Caller-Context');
      this.channelData[conn_id].callType = connEvent.getHeader(
        'variable_call_direction',
      ); // 呼叫类型，local,inboud,
      this.channelData[conn_id].originateCall = connEvent.getHeader(
        'variable_originate_call',
      );
      this.channelData[conn_id].originateTenant = connEvent.getHeader(
        'variable_originate_tenant',
      );
      this.channelData[conn_id].originateCallee = connEvent.getHeader(
        'variable_originate_callee',
      );

      this.channelData[conn_id].transferSource = connEvent.getHeader(
        'variable_transfer_source',
      );
      this.channelData[conn_id].transferHistory = connEvent.getHeader(
        'variable_transfer_history',
      );
      this.channelData[conn_id].sipHReferredBy = connEvent.getHeader(
        'variable_sip_h_Referred-By',
      );
      this.channelData[conn_id].sipReferTo = connEvent.getHeader(
        'variable_sip_refer_to',
      );
      this.channelData[conn_id].maxForwards = connEvent.getHeader(
        'variable_max_forwards',
      );
      this.channelData[conn_id].clickOut = connEvent.getHeader(
        'variable_click_dialout',
      );
      this.channelData[conn_id].clickAgent = connEvent.getHeader(
        'variable_click_agent',
      );
      this.channelData[conn_id].ivrTransfer = connEvent.getHeader(
        'variable_ivr_transfer',
      );

      this.channelData[conn_id].originateCallee = connEvent.getHeader(
        'variable_originate_callee',
      );

      this.runData[conn_id].tenantId = 1; //connEvent.getHeader('variable_sip_to_host',);
      this.runData[conn_id].callId = connEvent.getHeader('Unique-ID');
    }
    this.runData[conn_id].routerLine = this.getRouterLine(
      this.channelData[conn_id].callType,
    );
    this.runData[conn_id].caller = this.setCaller(conn_id);
    this.runData[conn_id].callee = this.setCalled(conn_id);

    // 盲转
    if (
      this.channelData[conn_id].sipHReferredBy &&
      this.channelData[conn_id].sipReferTo
    ) {
      this.logger.debug('RuntimeDataService', '电话转盲转中......');
      this.runData[conn_id].transferCall = true;
    }

    // this.logger.debug('Runtime Data:', this.channelData);
  }
  getRouterLine(callType?: string) {
    const routerLine: any = {
      calllocal: '本地',
      callin: '呼入',
      callout: '呼出',
    };
    return routerLine[callType as string];
  }

  getChannelData(conn_id: string) {
    return this.channelData[conn_id];
  }

  getRunData(conn_id: string) {
    return this.runData[conn_id];
  }

  getConn(conn_id: string) {
    return this.connections[conn_id];
  }

  getConnEvent(conn_id: string) {
    return this.connEvents[conn_id];
  }

  async setTenantInfo(conn_id: string) {
    try {
      const tenant = await this.tenantService.findById(
        this.runData[conn_id].tenantId as number,
      );
      if (!tenant) {
        throw new Error(`Can't find tenant: ${this.runData[conn_id].tenantId}!!!`);
      }
      this.tenantInfo[conn_id] = tenant;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  getTenantInfo(conn_id: string) {
    return this.tenantInfo[conn_id];
  }

  setCaller(conn_id: string) {
    let caller = this.channelData[conn_id].callerId;
    // let clickAgent = this.pbxApi.getChannelData().clickAgent;
    // if (this.clickOut && clickAgent) {
    //   caller = clickAgent
    // }
    return caller;
  }

  setCalled(conn_id: string) {
    let called = this.runData.isOriginateCall
      ? this.channelData[conn_id].originateCallee
      : this.channelData[conn_id].DestinationNumber;
    // if (called == 100) {
    //   called = this.pbxApi.getChannelData().sipToUser;
    // }
    return called;
  }

  setAnswered(conn_id: string) {
    this.runData[conn_id].answered = true;
    return;
  }

  addBleg(uuid: string, user: string) {
    this.blegIds.push(uuid);
    this.blegUsers.push(user);
  }

  /**
   * @description 根据分机号或者外线号码获取其legID
   */
  getLegIdByNumber(number: string) {
    const index = this.blegUsers.indexOf(number);
    if (index > -1) {
      return this.blegIds[index];
    } else {
      return '';
    }
  }

  increaseIvrCurrentDeep(conn_id: string, number: number = 1) {
    this.runData[conn_id].ivrCurrentDeep =
      this.runData[conn_id].ivrCurrentDeep + number;
  }
  setStatisData(data: ISatisData) {
    this.statisData = Object.assign({}, this.statisData, data);
  }

  setHangupBy(conn_id: string, hangupBy: string) {
    this.runData[conn_id].hangupBy = hangupBy;
  }

  getStatisData(conn_id: string) {
    return this.statisData[conn_id];
  }

  getCallId(conn_id:string): string {
    return this.runData[conn_id].callId;
  }
}
