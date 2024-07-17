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
  private channelData: IChannelData;
  private runData: IRunData;
  private statisData: ISatisData;
  private tenantInfo: any;
  private blegIds: string[];
  private blegUsers: string[]; //可以使用extension,外线号码
  constructor(
    private readonly logger: LoggerService,
    private fsPbx: FreeSwitchPbxService,
    private tenantService: TenantService,
  ) {
    this.channelData = {};
    this.runData = {
      tenantId: 0,
      callId: '',
      ivrMaxDeep: 100,
      ivrCurrentDeep: 0,
    };
    this.blegIds = [];
    this.blegUsers = [];
  }
  initData() {
    const connEvent: Event = this.fsPbx.getConnInfo();
    this.logger.debug('RuntimeDataService', 'Init Runtime Data!1');
    this.channelData.FSName = connEvent.getHeader('FreeSWITCH-Switchname');
    this.channelData.CoreUuid = connEvent.getHeader('Core-UUID');
    this.channelData.CallDirection = connEvent.getHeader('Call-Direction');
    this.channelData.callerId = connEvent.getHeader('Caller-Caller-ID-Number');
    this.channelData.callerName = connEvent.getHeader('Caller-Caller-ID-Name');
    this.channelData.calleeId = connEvent.getHeader('Caller-Callee-ID-Number');
    this.channelData.calleeName = connEvent.getHeader('Caller-Callee-ID-Name');
    this.channelData.DestinationNumber = connEvent.getHeader(
      'Caller-Destination-Number',
    );
    this.channelData.sipCallId = connEvent.getHeader('variable_sip_call_id');
    this.channelData.channelName = connEvent.getHeader('Caller-Channel-Name');
    this.channelData.useContext = connEvent.getHeader('Caller-Context');
    this.channelData.callType = connEvent.getHeader('variable_call_direction'); // 呼叫类型，local,inboud,
    this.channelData.originateCall = connEvent.getHeader(
      'variable_originate_call',
    );
    this.channelData.originateTenant = connEvent.getHeader(
      'variable_originate_tenant',
    );
    this.channelData.originateCallee = connEvent.getHeader(
      'variable_originate_callee',
    );

    this.channelData.transferSource = connEvent.getHeader(
      'variable_transfer_source',
    );
    this.channelData.transferHistory = connEvent.getHeader(
      'variable_transfer_history',
    );
    this.channelData.sipHReferredBy = connEvent.getHeader(
      'variable_sip_h_Referred-By',
    );
    this.channelData.sipReferTo = connEvent.getHeader('variable_sip_refer_to');
    this.channelData.maxForwards = connEvent.getHeader('variable_max_forwards');
    this.channelData.clickOut = connEvent.getHeader('variable_click_dialout');
    this.channelData.clickAgent = connEvent.getHeader('variable_click_agent');
    this.channelData.ivrTransfer = connEvent.getHeader('variable_ivr_transfer');

    this.channelData.originateCallee = connEvent.getHeader(
      'variable_originate_callee',
    );

    this.runData.tenantId = connEvent.getHeader('variable_sip_to_host');
    this.runData.callId = connEvent.getHeader('Unique-ID');
    this.runData.routerLine = this.getRouterLine(this.channelData.callType);
    this.runData.caller = this.setCaller();
    this.runData.callee = this.setCalled();

    // 盲转
    if (this.channelData.sipHReferredBy && this.channelData.sipReferTo) {
      this.logger.debug('RuntimeDataService', '电话转盲转中......');
      this.runData.transferCall = true;
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

  getChannelData() {
    return this.channelData;
  }

  getRunData() {
    return this.runData;
  }

  async setTenantInfo() {
    try {
      this.tenantInfo = await this.tenantService.findById(
        this.runData.tenantId as number,
      );
      if (!this.tenantInfo) {
        throw new Error(`Can't find tenant: ${this.runData.tenantId}!!!`);
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  getTenantInfo() {
    return this.tenantInfo;
  }

  setCaller() {
    let caller = this.channelData.callerId;
    // let clickAgent = this.pbxApi.getChannelData().clickAgent;
    // if (this.clickOut && clickAgent) {
    //   caller = clickAgent
    // }
    return caller;
  }

  setCalled() {
    let called = this.runData.isOriginateCall
      ? this.channelData.originateCallee
      : this.channelData.DestinationNumber;
    // if (called == 100) {
    //   called = this.pbxApi.getChannelData().sipToUser;
    // }
    return called;
  }

  setAnswered() {
    this.runData.answered = true;
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

  increaseIvrCurrentDeep(number: number = 1) {
    this.runData.ivrCurrentDeep = this.runData.ivrCurrentDeep + number;
  }
  setStatisData(data: ISatisData) {
    this.statisData = Object.assign({}, this.statisData, data);
  }

  setHangupBy(hangupBy: string) {
    this.runData.hangupBy = hangupBy;
  }

  getStatisData() {
    return this.statisData;
  }
}
