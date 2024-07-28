import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { IvrService } from './ivr.service';
import { PbxLocalNumberService } from 'src/pbx/services/pbx_local_number.service';
import { PbxCallProcessService } from '../pbx/services/pbx_call_process.service';
import { PbxCdrService } from 'src/pbx/services/pbx_cdr.service';
import { PbxIvrMenmuService } from 'src/pbx/services/pbx_ivr_menmu.service';
import { PbxRecordFileService } from 'src/pbx/services/pbx_record_file.service';
import { PbxExtensionnService } from 'src/pbx/services/pbx_extensionn.service';
import { TenantService } from 'src/tenant/tenant.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { RuntimeDataService } from './runtime-data.service';
import { HangupCase } from '../pbx/entities/pbx_queue_statistic';
import { ExtensionSate, PbxExtensionn } from 'src/pbx/entities/pbx_extensionn';
import { CcqueueService } from './ccqueue.service';

type DialLocalResult = {
  localType: string;
};

@Injectable()
export class FlowBaseService {
  constructor(
    private readonly logger: LoggerService,
    private ivr: IvrService,
    private pbxLocalNumberService: PbxLocalNumberService,
    private pbxCallProcessService: PbxCallProcessService,
    private pbxCdrService: PbxCdrService,
    private pbxIvrMenuService: PbxIvrMenmuService,
    private pbxRecordFileService: PbxRecordFileService,
    private pbxExtensionService: PbxExtensionnService,
    private tenantService: TenantService,
    private fsPbx: FreeSwitchPbxService,
    private runtimeData: RuntimeDataService,
    private ccQueue: CcqueueService,
  ) {}
  /**
   * @description 拨打本地号码，包括分机，队列，IVR等
   */
  async diallocal(conn_id: string, number: string) {
    try {
      this.logger.debug('FlowBaseService', `Dial A Local Number:${number}`);
      const { tenantId, callId, caller } = this.runtimeData.getRunData(conn_id);
      if (/@/.test(number)) {
        return Promise.reject(`Can't Dial Other Tenand!Called Is:${number}.`);
      } else {
        const { localType, assign } =
          await this.pbxLocalNumberService.getLocalByNumber(tenantId, number);
        const result: DialLocalResult = {
          localType,
        };

        await this.pbxCdrService.updateCalled(tenantId, callId, number);
        this.logger.debug('FlowBaseService', `Local Number Type:${localType}`);
        switch (localType) {
          case 'ivr': {
            await this.dialIVR(conn_id, number);
            break;
          }
          case 'extension': {
            await this.pbxCallProcessService.create({
              caller,
              called: number,
              tenantId,
              callId,
              processName: localType,
              passArgs: { number },
            });
            await this.dialExtension(conn_id, number);
            break;
          }
          case 'queue': {
            this.runtimeData.initQueueData(conn_id);
            await this.dialQueue(conn_id, number);
            break;
          }
          case 'voicemail':
          case 'conference':
          case 'fax':
          default:
            break;
        }
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * @description 拨打出局电话
   * */
  async dialout(conn_id: string, number: string, args: any = {}) {
    try {
      this.logger.debug('FlowBaseService', `Dial A Outer Number:${number}`);
      const { tenantId, callId, caller, transferCall, answered } =
        this.runtimeData.getRunData(conn_id);
      const { FSName, useContext, clickOut } =
        this.runtimeData.getChannelData(conn_id);

      await this.pbxCdrService.updateCalled(tenantId, callId, number);
      const tenantInfo = await this.runtimeData.getTenantInfo(conn_id);

      const setData: any = {
        call_timeout: 30, // 呼叫超时
        bridge_answer_timeout: 30,
        // exec_after_bridge_app: 'start_dtmf',
        // "effective_caller_id_name": '', // 主叫名称
        // "effective_caller_id_number": '', // 主叫号码
        // "ringback":'', // 回铃音
      };
      if (args.timeout) {
        setData.call_timeout = args.timeout;
        setData.bridge_answer_timeout = args.timeout;
      }
      if (args.callerName) {
        setData['effective_caller_id_name'] = args.callerName;
      }
      // TODO 是否需要验证该callerId的合法性?
      // setData['effective_caller_id_number'] = tenantInfo && tenantInfo.options && tenantInfo.options.useExtenForCaller ? caller : DND;
      this.pbxCallProcessService.create({
        caller,
        called: number,
        tenantId,
        callId,
        processName: 'dialout',
        passArgs: {},
        // passArgs: { dnd: DND, caller, number, gateway: _this.R.gateway, agentId },
      });

      if (args.ringback) {
        setData['ringback'] = args.ringback || '${us-ring}';
      }

      const { dnd, gateway } = await this.tenantService.getDialGateWay({
        tenantId,
        callId,
      });

      await this.pbxCdrService.lastApp(callId, tenantId, 'dialOut');
      // _this.R.agentLeg[`${caller}`] = _this.R.callId;
      let cgr_category = 'call_internal';
      if (clickOut === 'yes' || transferCall || args.isLastService) {
        cgr_category = 'call_out';
      }
      const bLegCgrVars = this.setBLegCgr();
      if (/@/.test(number)) {
        return Promise.reject(`Can't Dial Other Tenand!Called Is:${number}.`);
      } else {
        if (gateway && gateway !== '') {
          await this.fsPbx.uuidSetMutilVar(conn_id, callId, setData);
          let dialStr = `${bLegCgrVars}sofia/external/${number}@${gateway}`;
          this.logger.debug('FlowBaseService', 'dialout dialStr:', { dialStr });
          // if (this.config..gg) {
          //     // TODO 如果不用代理,正常情况应该是通过gateway,以下是开发测试
          //     dialStr = `${bLegCgrVars}user/${number}`;
          // }

          const onCallerHangup = async (evt: any) => {
            try {
              await this.pbxCdrService.lastApp(
                callId,
                tenantId,
                `Dialout Caller Hangup:${evt.getBody()}`,
              );
              await this.pbxExtensionService.setAgentState(
                tenantId,
                caller as string,
                ExtensionSate.idle,
              );
            } catch (ex) {
              this.logger.error(`Dialout Caller Hangup Error:`, ex);
            }
          };

          this.fsPbx.addConnLisenter(
            conn_id,
            `esl::event::CHANNEL_HANGUP::${callId}`,
            'once',
            onCallerHangup,
          );

          let ringTime: number;
          const onOriginate = async ({
            bLegId,
            evt,
          }: {
            bLegId: string;
            evt: any;
          }) => {
            try {
              ringTime = new Date().getTime();
              await this.pbxCallProcessService.create({
                caller,
                called: number,
                tenantId,
                callId,
                processName: 'ringing',
                passArgs: { number: number, agentId: '' },
              });
            } catch (ex) {
              this.logger.error(`Dialout Caller On Originate Error:`, ex);
            }
          };

          let answerTime = 0;
          let doneDTMFEvent = false;

          const onAnswer = async (
            conn_id: string,
            {
              bLegId,
              evt,
            }: {
              bLegId: string;
              evt: any;
            },
          ) => {
            try {
              await this.fsPbx.uuidSetvar(conn_id, {
                uuid: bLegId,
                varname: 'hangup_after_bridge',
                varvalue: 'false',
              });

              if (!answered) {
                this.runtimeData.setAnswered(conn_id);
              }
              await this.pbxCallProcessService.create({
                caller,
                called: number,
                tenantId,
                callId,
                processName: 'answer',
                passArgs: { number: number, agentId: '' },
              });
              answerTime = new Date().getTime();

              this.pbxExtensionService.setAgentState(
                tenantId,
                caller as string,
                ExtensionSate.inthecall,
              );
            } catch (ex) {
              this.logger.error(`Dialout Caller On Answer Error:`, ex);
            }
          };

          const onHangup = async ({
            bLegId,
            evt,
            hangupBy,
          }: {
            bLegId: string;
            evt: any;
            hangupBy: string;
          }) => {
            try {
              const hangUpCase = evt.getHeader('Hangup-Cause');
              let hangupType = !transferCall
                ? 'hangUp-callOut'
                : 'hangUp-transfer';
              let by = hangupBy == 'callee' ? 'visitor' : 'agent';

              let hangupMsg = '';
              switch (hangUpCase) {
                case 'ORIGINATOR_CANCEL':
                  hangupMsg = '取消呼叫';
                  by = 'agent';
                  break;
                case 'NO_USER_RESPONSE':
                  hangupMsg = '用户无应答';
                  by = 'visitor';
                  break;
                case 'NO_ANSWER':
                  hangupMsg = '用户未应答';
                  by = 'visitor';
                  break;
                case 'CALL_REJECTED':
                  hangupMsg = '用户拒接';
                  by = 'visitor';
                  break;
                case 'INCOMPATIBLE_DESTINATION':
                  hangupMsg = '用户无应答';
                  by = 'visitor';
                  break;
                case 'UNALLOCATED_NUMBER':
                  hangupMsg = '用户无应答';
                  by = 'visitor';
                  break;
                case 'USER_BUSY':
                  hangupMsg = '用户忙线';
                  by = 'visitor';
                  break;
                default:
                  break;
              }
              await this.pbxCallProcessService.create({
                caller,
                called: number,
                tenantId,
                callId,
                processName: 'hangup',
                passArgs: {
                  number: number,
                  agentId: '',
                  hangupMsg: '结束通话',
                },
              });
            } catch (ex) {
              this.logger.error(`Dialout Caller On Hangup Error:`, ex);
            }
          };

          //const bridgeResult = await _this.bridgeAcallB(caller, number, onOriginate, onAnswer, onHangup)

          const bridgeResult = await this.bridgeACall(
            conn_id,
            dialStr,
            number,
            onAnswer,
            onHangup,
            onOriginate,
          );

          await this.fsPbx.wait(500);
          // 处理如果需要处理DTMF响应
          if (doneDTMFEvent) {
            // await new Promise((resolve, reject) => {
            //     EE3.once('esl::callout::done::dtmf::end', () => {
            //         logger.debug('FlowBaseService','esl::callout::done::dtmf::end');
            //         resolve();
            //     })
            // })
          }
          // 处理如果有失败流程需要处理
          else if (
            (!bridgeResult.success ||
              bridgeResult.cause !== 'NORMAL_CLEARING') &&
            args.failDone
          ) {
            // await this.dialFailDone(args);
          }
          this.logger.debug('FlowBaseService', '结束外呼');
          return bridgeResult;
        } else {
          await this.pbxExtensionService.setAgentState(
            tenantId,
            caller as string,
            ExtensionSate.idle,
          );
          return { success: false, cause: `DON'T HAVE A GATEWAY` };
        }
      }
    } catch (ex) {
      const { tenantId, callId, caller, transferCall, answered } =
        this.runtimeData.getRunData(conn_id);
      await this.pbxExtensionService.setAgentState(
        tenantId,
        caller as string,
        ExtensionSate.idle,
      );
      return Promise.reject(ex);
    }
  }

  setBLegCgr(timeout = 30) {
    // absolute_codec_string='G729,OPUS,G722,PCMU,PCMA',
    // bridge_filter_dtmf=true,
    const args = [];
    // args.push('bridge_pre_execute_bleg_app=start_dtmf'); // brige前,bleg执行的APP
    // args.push('bridge_pre_execute_bleg_data=');
    // args.push('exec_after_bridge_app=start_dtmf');
    args.push('hangup_after_bridge=false');
    args.push(`bridge_answer_timeout=${timeout}`);
    const str = `{${args.join(',')}}`;
    return str;
  }

  /**
   * @description 拨打分机
   */
  async dialExtension(
    conn_id: string,
    number: string,
    args?: any,
  ): Promise<{ answered: boolean; error: string }> {
    try {
      const { tenantId, callId, caller, answered, routerLine } =
        this.runtimeData.getRunData(conn_id);
      let result = {
        answered: false,
        error: '',
      };
      this.pbxCdrService.lastApp(callId, tenantId, 'extension');
      const setData: any = {
        call_timeout: 60, // 呼叫超时
        // "effective_caller_id_name": '', // 主叫名称
        //"effective_caller_id_number": '', // 主叫号码
        //"ringback":'', // 回铃音
      };
      args = args || {
        timeout: 30 * 1000,
      };
      //setData.call_timeout = 50 * 1000;
      setData['ringback'] = '${us-ring}';

      await this.fsPbx.uuidSetMutilVar(conn_id, callId, setData);
      let cgr_category = '';
      let cdrUid = '';
      //if (_this.R.clickOut === 'yes') {
      cgr_category = 'call_internal';
      // }

      const blegArgs = [];
      // blegArgs.push('bridge_pre_execute_bleg_app=start_dtmf'); // brige前,bleg执行的APP
      // blegArgs.push('bridge_pre_execute_bleg_data=');
      // blegArgs.push('exec_after_bridge_app=start_dtmf');
      blegArgs.push('hangup_after_bridge=false');
      blegArgs.push(`bridge_answer_timeout=30`);

      const bLegCgrVars = `{${blegArgs.join(',')}}`;
      // let dialStr = `${bLegCgrVars}sofia/external/${number}@${tenantId}`;
      let dialStr = `{sip_invite_domain='192.168.2.230'}user/${number}@${tenantId}`;

      await this.pbxExtensionService.setAgentLastCallId(
        tenantId,
        number,
        callId,
      );

      const onAnswer = async (conn_id: string) => {
        if (!answered) {
          this.runtimeData.setAnswered(conn_id);
        }
        await this.pbxCallProcessService.create({
          caller,
          called: number,
          tenantId,
          callId,
          processName: 'answer',
          passArgs: { number: number, agentId: agentId },
        });
        await this.pbxExtensionService.setAgentState(
          tenantId,
          caller as string,
          ExtensionSate.inthecall,
        );
        await this.pbxExtensionService.setAgentState(
          tenantId,
          number,
          ExtensionSate.inthecall,
        );
      };

      const onHangup = async (
        conn_id: string,
        { evt, bLegId, hangupBy }: any,
      ) => {
        const transferInfo = {
          transferDisposition: evt.getHeader('variable_transfer_disposition'),
          transferTo: evt.getHeader('variable_transfer_to'),
          transferDestination: evt.getHeader('variable_transfer_destination'),
          transferFallbackExtension: evt.getHeader(
            'variable_transfer_fallback_extension',
          ),
          endpointDisposition: evt.getHeader('variable_endpoint_disposition'),
        };
        // 被叫分机盲转
        if (
          transferInfo &&
          transferInfo.endpointDisposition === 'BLIND_TRANSFER'
        ) {
        }
        //此处处理被叫分机挂机后的业务,默认是挂断通话
        else {
          this.logger.debug(
            'FlowBaseService',
            `处理被叫分机挂机后的业务,默认是挂断通话!hangupBy:${hangupBy}`,
          );
          if (hangupBy === 'callee') {
            this.runtimeData.setHangupBy(conn_id, hangupBy);
          }
        }
        await this.pbxCallProcessService.create({
          caller,
          called: number,
          tenantId,
          callId,
          processName: 'hangup',
          passArgs: {
            number: number,
            agentId: agentId,
            desc: 'calledExtension',
          },
        });
      };

      // const originationUuid = await this.fsPbx.createUuid();
      // this.runtimeData.addBleg(originationUuid, number);
      // await this.fsPbx.filter('Unique-ID', originationUuid);

      // this.fsPbx.addConnLisenter(`esl::event::CHANNEL_ANSWER::${originationUuid}`, 'once', onAnswer);
      // this.fsPbx.addConnLisenter(`esl::event::CHANNEL_HANGUP::${originationUuid}`, 'once', onHangup);
      // this.fsPbx.addConnLisenter(`esl::event::CHANNEL_HANGUP::${callId}`, 'once', onAnswer);

      const extensionInfo = await this.pbxExtensionService.getExtenByNumber(
        tenantId,
        number,
      );
      const {
        state: agentState,
        agentId,
        status: agentStatus,
      } = extensionInfo as PbxExtensionn;
      // 本地呼叫时,改变坐席状态为dialout
      if (routerLine === '本地') {
        await this.pbxExtensionService.setAgentState(
          tenantId,
          caller as string,
          ExtensionSate.dialout,
        );
      }
      const canCallState = ['waiting', 'busy', 'idle', 'rest'];

      if (canCallState.indexOf(agentState) > -1) {
        await this.pbxExtensionService.setAgentState(
          tenantId,
          number,
          ExtensionSate.ringing,
        );
      } else {
        // TODO 系统提示所拨打的用户忙,稍后再拨打
        const errMsg = `被叫分机:${number}状态${agentState}无法呼叫,呼叫失败!`;
        this.logger.info('FlowBaseService', errMsg);
        await this.pbxExtensionService.setAgentState(
          tenantId,
          caller as string,
          ExtensionSate.idle,
        );

        // await _this.R.pbxApi.hangup('USER_BUSY');
        // return Promise.resolve(result);
      }
      // const oriResult = await this.fsPbx.originate(dialStr, '&park()', blegArgs.join(','), originationUuid);

      this.fsPbx.message(conn_id, {
        sessionId: callId,
        msgType: 'call',
        from: 'system' + '@' + tenantId,
        to: number + '@' + tenantId,
        subject: 'chat',
        profile: 'internal', //'external'
        body: 'new',
      });

      const bridgeResult = await this.bridgeACall(
        conn_id,
        dialStr,
        number,
        onAnswer,
        onHangup,
      );

      this.logger.debug(
        'FlowBaseService',
        '结束本地呼叫分机!更改主叫,被叫分机状态!',
      );

      result.answered = bridgeResult.success;
      result.error = bridgeResult.cause;
      await this.pbxExtensionService.setAgentState(
        tenantId,
        caller as string,
        ExtensionSate.idle,
      );
      await this.pbxExtensionService.setAgentState(
        tenantId,
        number,
        ExtensionSate.idle,
      );

      // await _this.R.pbxApi.disconnect('拨打本地分机结束,关闭ESL Socket!');
      // }
      if (!bridgeResult.success && args.failDone) {
        switch (args.failDone.type) {
          case 'ivr': {
            await this.ivr.ivrAction(conn_id, {
              ivrNumber: args.failDone.gotoIvr,
              ordinal: args.failDone.gotoIvrActId || 1,
              uuid: callId,
            });
            break;
          }
          default: {
          }
        }
      }

      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * @description
   * 外呼或者呼叫内部分机时,发起bridge B-leg
   * @param tag
   * @param dialStr
   * @param calledNumber
   * @param rLine
   * @param onAnswer
   * @param onHangup
   * @param onOriginate
   * @return {*}
   */
  async bridgeACall(
    conn_id: string,
    dialStr: string,
    calledNumber: string,
    onAnswer?: any,
    onHangup?: any,
    onOriginate?: any,
  ) {
    try {
      const { callId, tenantId, caller, routerLine } =
        this.runtimeData.getRunData(conn_id);
      const { channelName, useContext, sipCallId, CallDirection, callType } =
        this.runtimeData.getChannelData(conn_id);
      let cdrUid = 0;
      let hasListenOutGoing = false;
      let BLegId = '';

      const onOutGoing = async (evt: any) => {
        const aLegId = evt.getHeader('Other-Leg-Unique-ID');
        const bLegId = (BLegId = evt.getHeader('Unique-ID'));
        this.logger.debug('FlowBaseService', 'Dial A Call CHANNEL_OUTGOING', {
          aLegId,
          bLegId,
        });

        if (aLegId === callId && !hasListenOutGoing) {
          this.fsPbx.removeConnLisenter(
            conn_id,
            `esl::event::CHANNEL_OUTGOING::**`,
            onOutGoing,
          );
          if (onOriginate && typeof onOriginate === 'function') {
            onOriginate({ bLegId, evt });
          }
          let answered = false;
          let doneHangup = false;
          this.runtimeData.addBleg(bLegId, calledNumber);

          await this.fsPbx.filter(conn_id, 'Unique-ID', bLegId);

          const cdrCreateR = await this.pbxCdrService.createCdr({
            tenantId: tenantId,
            routerLine: routerLine,
            srcChannel: channelName,
            context: useContext,
            caller: caller,
            called: calledNumber,
            callFrom: caller,
            callTo: calledNumber,
            callId: `unknown-${callId}-${new Date().getTime()}`,
            recordCall: true,
            isTransfer: false,
            agiType: 'b-leg',
            isClickOut: false,
            associateId: callId,
          });
          cdrUid = cdrCreateR.id;

          const onCallerHangup = async (evt: any) => {
            try {
              if (!answered) {
                this.logger.debug(
                  'FlowBaseService',
                  'bridgeACall被叫未接听,主叫先挂机!',
                );
                if (!doneHangup && onHangup && typeof onHangup === 'function') {
                  doneHangup = true;
                  await onHangup({ bLegId, evt, hangupBy: 'caller' });
                }
              } else {
                this.logger.debug(
                  'FlowBaseService',
                  'bridgeACall被叫已接听,主叫先挂机!',
                );
              }
            } catch (ex) {
              this.logger.error(
                'Bridge a call on handle caller hangup error:',
                ex,
              );
            }
          };

          const onBlegAnswer = async (evt: any) => {
            try {
              this.logger.debug(
                'FlowBaseService',
                `bridgeACall被叫应答了:${bLegId}`,
              );
              answered = true;
              //  if (!_this.R.transferCall) {
              // if (_this.R.tenantInfo && _this.R.tenantInfo.recordCall !== false) {
              const recordFileName = `${callId}.${bLegId}`;
              this.fsPbx
                .uuidRecord(
                  conn_id,
                  callId,
                  'start',
                  tenantId,
                  '',
                  recordFileName,
                )
                .then((res) => {
                  this.logger.debug(
                    'FlowBaseService',
                    'Bridge a call record success!',
                  );
                  return this.pbxRecordFileService.create({
                    tenantId: tenantId,
                    direction: callType,
                    callId: callId,
                    filename: recordFileName,
                    folder: res.folder,
                    agentId: 0, //`${agentId}`
                  });
                })
                .catch((err) => {
                  this.logger.error('Bridge a call record error:', err);
                });
              //  }
              await this.pbxCdrService.answered(tenantId, callId, bLegId);
              //   }
              await this.pbxCdrService.bLegAnswered(cdrUid, bLegId);
              if (onAnswer && typeof onAnswer === 'function') {
                await onAnswer({ bLegId, evt });
              }
            } catch (ex) {
              this.logger.error(
                'Bridge a call on handle bleg answer error:',
                ex,
              );
            }
          };

          const onBelgHangup = async (evt: any) => {
            try {
              const hangupCause = evt.getHeader('Hangup-Cause');
              await this.pbxCdrService.cdrBLegHangup(cdrUid, hangupCause);
              this.logger.debug(
                'FlowBaseService',
                `bridgeACall bleg[${bLegId}] hangup！`,
                bLegId,
              );
              if (
                !doneHangup &&
                answered &&
                onHangup &&
                typeof onHangup === 'function'
              ) {
                doneHangup = true;
                await onHangup({ bLegId, evt, hangupBy: 'callee' });
              }
            } catch (ex) {
              this.logger.error(
                'Bridge a call on handle bleg hangup error:',
                ex,
              );
            }
          };

          this.fsPbx.addConnLisenter(
            conn_id,
            `esl::event::CHANNEL_HANGUP::${callId}`,
            'once',
            onCallerHangup,
          );

          this.fsPbx.addConnLisenter(
            conn_id,
            `esl::event::CHANNEL_ANSWER::${bLegId}`,
            'once',
            onBlegAnswer,
          );
          hasListenOutGoing = true;
          // _this.R.pbxApi.filterDelete('Event-Name', 'CHANNEL_OUTGOING');

          this.fsPbx.addConnLisenter(
            conn_id,
            `esl::event::CHANNEL_HANGUP::${bLegId}`,
            'once',
            onBelgHangup,
          );
        }
      };

      this.fsPbx.addConnLisenter(
        conn_id,
        `esl::event::CHANNEL_OUTGOING::**`,
        'on',
        onOutGoing,
      );

      await this.fsPbx.uuidSetMutilVar(conn_id, callId, {
        hangup_after_bridge: 'false',
        sip_h_X: sipCallId,
      });
      // await _this.R.pbxApi.filter('Event-Name', 'CHANNEL_OUTGOING');
      const bridgeResult = await this.fsPbx.bridge(conn_id, callId, dialStr);
      // bridge结束后才会执行下面的语句
      this.logger.debug('FlowBaseService', `PBX Bridge Result:`, bridgeResult);
      if (!bridgeResult.success) {
        await this.pbxCdrService.cdrBLegHangup(cdrUid, bridgeResult.cause);
      }

      // if (_this.R.lastLogic === 'hold' || _this.R.lastLogic === 'consult' || _this.R.lastLogic === 'ivr-transfer') {
      //     _this.R.logger.debug('FlowBaseService',_this.loggerPrefix, 'In Bridge A Call When Last Logic Is :', _this.R.lastLogic);
      //     await _this.onCallerHangup();
      // }
      return Object.assign({}, bridgeResult, { bLegId: BLegId });
    } catch (ex) {
      this.logger.error('FlowBaseService', ex);
      return Promise.resolve({ success: false, cause: 'Bridge异常!' });
    }
  }

  async dialIVR(conn_id: string, number: string) {
    try {
      const { answered, tenantId, callId, caller } =
        this.runtimeData.getRunData(conn_id);

      if (!answered) {
        this.logger.debug('FlowBaseService', `dialIVR1:`, {
          answered,
          tenantId,
          callId,
          caller,
        });
        await new Promise((resolve, reject) => {
          this.fsPbx.addConnLisenter(
            conn_id,
            `esl::event::CHANNEL_ANSWER::${callId}`,
            'once',
            (evt: any) => {
              resolve(null);
            },
          );
          // this.fsPbx
          //   .uuidTransfer(conn_id, callId, 'ivr')
          //   .then((transferRes) => {})
          //   .catch((err) => {
          //     reject(err);
          //   });
          this.fsPbx.answer(conn_id, callId).then(res=>{}).catch(err=>{
            reject(err);
          })
        });

        this.logger.debug('FlowBaseService', `dialIVR2:`, {
          answered,
          tenantId,
          callId,
          caller,
        });
        this.runtimeData.setAnswered(conn_id);
        // await this.fsPbx.startDTMF();
      }
      const ivrInfo = await this.pbxIvrMenuService.getIVRByNumber(
        tenantId,
        number,
      );
      await this.pbxCallProcessService.create({
        caller,
        called: number,
        tenantId,
        callId,
        processName: 'ivr',
        passArgs: { number, ivrName: ivrInfo ? ivrInfo.ivrName : `${number}` },
      });
      const result = await this.ivr.ivrAction(conn_id, {
        ivrNumber: number,
        ordinal: 1,
        uuid: callId,
      });
      // 下一步需要拨打一个本地号码
      if (result.nextType === 'diallocal') {
        this.logger.debug('FlowBaseService', '拨打IVR的结果是要继续拨打local');
        await this.diallocal(conn_id, result.nextArgs as string);
      }
      // 正常结束IVR
      else {
        this.logger.debug('FlowBaseService', '拨打IVR结束:', result);
      }
    } catch (ex) {
      console.log(ex);
      return Promise.reject(ex);
    }
  }

  async dialQueue(conn_id: string, number: string) {
    try {
      const { answered, tenantId, callId, caller } =
        this.runtimeData.getRunData(conn_id);
      const result = await this.ccQueue.dialQueue(conn_id, number);
      this.logger.debug(
        'FlowBaseService',
        `Dial Queue ${number} Result:`,
        result,
      );

      if (result.gotoIvrNumber) {
        await this.ivr.ivrAction(conn_id, {
          ivrNumber: result.gotoIvrNumber,
          ordinal: result.gotoIvrActId,
          uuid: callId,
        });
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
