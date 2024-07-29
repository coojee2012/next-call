import { Injectable } from '@nestjs/common';
import { Queue, Job, QueueOptions } from 'bull';
import { LoggerService } from 'src/logger/logger.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { RuntimeDataService } from './runtime-data.service';
import { ConfigService } from '@nestjs/config';
import { QueueWorkerService } from './queue-worker.service';
import { EventService } from './event/event.service';
import { PbxCallProcessService } from 'src/pbx/services/pbx_call_process.service';
import { PbxQueueService } from 'src/pbx/services/pbx_queue.service';
import { PbxQueueStatisticService } from 'src/pbx/services/pbx_queue_statistic.service';
import { PbxAgentStatisticService } from 'src/pbx/services/pbx_agent_statistic.service';
import { PbxExtensionnService } from 'src/pbx/services/pbx_extensionn.service';
import { TenantService } from 'src/tenant/tenant.service';
import { PbxCdrService } from 'src/pbx/services/pbx_cdr.service';
import { PbxRecordFileService } from 'src/pbx/services/pbx_record_file.service';
import { PbxAgentService } from 'src/pbx/services/pbx_agent.service';
import { PbxQueue } from 'src/pbx/entities/pbx_queue';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PbxQueueOption } from 'src/pbx/entities/pbx_queue_option';
import { AnswerStatus } from 'src/pbx/entities/pbx_cdr';
import { HangupCase } from 'src/pbx/entities/pbx_queue_statistic';
import { ExtensionSate } from 'src/pbx/entities/pbx_extensionn';
import { ThisExpression } from 'ts-morph';
import { error } from 'console';
import { PbxAgent } from 'src/pbx/entities/pbx_agent';

export type dialQueueMemberResult = {
  success: boolean;
  reason?: string;
};

export type dialQueueResult = {
  success: boolean;
  app: string;
  gotoIvrNumber: string; // 队列执行完毕后,去向IVR
  gotoIvrActId: number;
  callerHangup: boolean;
  answered: boolean;
  hasDone: boolean;
  agentNumber: string;
};

@Injectable()
export class CcqueueService {
  constructor(
    private readonly logger: LoggerService,
    private eventEmitter: EventEmitter2,
    private fsPbx: FreeSwitchPbxService,
    private runtimeData: RuntimeDataService,
    private config: ConfigService,
    private queueWorker: QueueWorkerService,
    private eventService: EventService,
    private pbxCallProcessService: PbxCallProcessService,
    private pbxQueueService: PbxQueueService,
    private pbxQueueStatisticService: PbxQueueStatisticService,
    private pbxAgentStatisticService: PbxAgentStatisticService,
    private pbxExtensionService: PbxExtensionnService,
    private pbxTenantService: TenantService,
    private pbxAgentService: PbxAgentService,
    private pbxCdrService: PbxCdrService,
    private pbxRecordFileService: PbxRecordFileService,
  ) {}
  /**
   * @description
   * 拨打队列
   * @param queueNumber
   * @returns {Promise.<*>}
   */
  async dialQueue(
    conn_id: string,
    queueNumber: string,
  ): Promise<dialQueueResult> {
    try {
      this.logger.debug(
        'CcqueueService',
        `queueNumber:${queueNumber},sipRegInFS:${this.config.get('sipRegInFS')}`,
      );
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const { CallDirection, callType } =
        this.runtimeData.getChannelData(conn_id);
      const tenantInfo = await this.runtimeData.getTenantInfo(conn_id);
      this.runtimeData.setQueueData(conn_id, { agentEndState: 'idle' });
      const bullQueueName = `esl_q_queue::${tenantId}::${queueNumber}`;
      const bullQueue = (await this.queueWorker.add(
        tenantId as number,
        queueNumber,
      )) as Queue;
      this.runtimeData.setBullQueue(conn_id, bullQueue);
      this.addBullQueueMonitor(conn_id);

      let result: dialQueueResult = {
        success: false,
        app: 'dial-queue',
        gotoIvrNumber: '', // 队列执行完毕后,去向IVR
        gotoIvrActId: 1,
        callerHangup: false,
        answered: false,
        hasDone: false,
        agentNumber: '',
      };

      //_this.R.logger.debug('CCQueueService','DEBUG_CONFIG:', _this.R.config);
      const agentType = this.config.get('sipRegInFS') ? 'user' : 'kamailio';
      const pbxQueue = await this.pbxQueueService.getQueue(
        tenantId,
        queueNumber,
      );
      
      const enterQueueTime = await this.fsPbx.getChannelVar(
        conn_id,
        'queue_enter_time',
        callId,
      );

      this.pbxCallProcessService.create({
        caller,
        called: queueNumber,
        tenantId,
        callId,
        processName: 'queue',
        passArgs: { number: queueNumber, queueName: pbxQueue?.queueName },
      });

      // 用户没有设置reqType
      // this.cgrReqType = await this.fsPbx.getChannelVar(
      //   conn_id,
      //   'cgr_reqtype',
      //   callId,
      // );

      if (pbxQueue) {
        this.runtimeData.setQueueData(conn_id, { queue: pbxQueue });
        const { queueName, queueOption } = pbxQueue;
        const { maxWaitTime, enterTipFile } = queueOption;

        this.logger.debug('CCQueueService', `queue find in DB:${queueName}`);

        // _this.setQueueWaitingInfo(tenantId, queueNumber, queueName);
        // 设置队列排队的信息 更新到前端

        this.runtimeData.setQueueData(conn_id, {
          startTime: new Date().getTime(),
        });
        await this.pbxQueueStatisticService.create({
          callId,
          tenantId,
          queueNumber,
          onDutyAgents: pbxQueue.members,
        });

        if (!pbxQueue.members.length) {
          this.logger.debug('CCQueueService', '=====ENTER A EMPTY QUEUE=====');
          await this.enterEmptyQueue(conn_id);
          return Promise.resolve(result);
        }

        const findQueueMemberEvent = `esl::callcontrol::queue::finded::member::${tenantId}::${callId}`;
        const callerHangupEvent = `esl::event::CHANNEL_HANGUP::${callId}`;

        const vipLevel = 0; //await service.httppbx.checkPhoneVIP(tenantId, caller);

        const maxLowLevel = 540; // 越高优先级越低

        const priority = maxLowLevel - vipLevel * 30;
        this.runtimeData.setQueueData(conn_id, { vipLevel, priority });
        // 进入队列提醒
        if (enterTipFile) {
          this.logger.debug('CCQueueService', `进入队列提醒:${enterTipFile}`);
          const enterTipFile2 = await this.fillSoundFilePath(enterTipFile);
          await this.fsPbx.uuidPlayback(conn_id, {
            uuid: callId,
            terminators: 'none',
            file: enterTipFile2,
          });
        }
        // 每隔1秒检查是否超时了
        // this.setIntervalTimeout = setInterval(this.timoutCheck.bind(this), 1000);

        let findQueueMemberExec = false;

        // 未应答前主叫挂机,坐席接听电话后将取消这个监听

        this.fsPbx.addConnLisenter(
          conn_id,
          callerHangupEvent,
          'once',
          this.onCallerHangupHandle.bind(this),
        );
        this.fsPbx.addConnLisenter(
          conn_id,
          `esl::event::PLAYBACK_START::${callId}`,
          'once',
          this.startFindMemberJob.bind(this),
        );

        this.eventEmitter.once(
          findQueueMemberEvent,
          (evt: any) => {
            this.onFindQueueMemberByRedisPub.bind(this)( conn_id, evt);
          }
          
        );

        const queueMusicFile =
          pbxQueue.queueOption.mohSound || 'local_stream://moh/8000';
        this.runtimeData.setQueueData(conn_id, { queueMusicFile });
        await this.fsPbx.pre_answer(conn_id,callId);
        await this.playQueueMusic(conn_id);

        // 下面的代码只有在answer之后才能执行
        const bridgeResult = await new Promise<any>((resolve, reject) => {
          this.logger.debug(
            'CCQueueService',
            '======FIND_QUEUE_MEMBER_ING======',
          );
          this.eventEmitter.once(
            `caller::hangup::when::wait::${callId}`,
            () => {
              reject('Caller Is Hangup  Waiting In Queue!');
            },
          );

          this.eventEmitter.once(
            `queue::after::bridge::${callId}`,
            (res: any) => {
              // this.fsPbx.removeConnLisenter(callerHangupEvent, this.onCallerHangupHandle.bind(this));
              // this.eventService.removeListener(findQueueMemberEvent, this.onFindQueueMember.bind(this));
              resolve(res);
            },
          );
        });
        await this.fsPbx.wait(300);
        await new Promise((resolve, reject) => {
          result = Object.assign({}, result, bridgeResult);
          this.logger.debug(
            'CCQueueService',
            'FIND_QUEUE_MEMBER_DONE:',
            {result}
          );
          let doneOver = false;
          const doneAfter = async () => {
            try {
              await this.afterQueueEnd(conn_id, {
                answered: result.answered,
                agentNumber: result.agentNumber,
                queueNumber,
              });
              return Promise.resolve();
            } catch (ex) {
              return Promise.reject(ex);
            }
          };

          if (!result.answered) {
            resolve(null);
          } else {
            const { answered, agentNumber: whoAnswered } = result;

            const onAgentHangup = async (evt: any) => {
              try {
                this.logger.debug(
                  'CCQueueService',
                  `FIND_QUEUE_MEMBER_DONE中监听到坐席${whoAnswered}挂机了!`,
                );
                await doneAfter();
                if (!doneOver) {
                  doneOver = true;
                  const timestamp = new Date().getTime();
                  const {
                    originationUuid,
                    isCallerHangup,
                    agentId,
                    answerTime,
                    ringTime,
                  } = this.runtimeData.getQueueData(conn_id);
                  await this.pbxAgentStatisticService.hangupCall({
                    callId: callId,
                    bLegId: originationUuid,
                    hangupCase: 'agent',
                  });

                  await this.pbxCallProcessService.create({
                    caller: caller,
                    called: whoAnswered,
                    tenantId,
                    callId,
                    processName: 'hangup',
                    passArgs: {
                      number: String(whoAnswered),
                      agentId: '',
                      hangupMsg: '结束通话',
                    },
                  });

                  if (queueOption && queueOption.transferStatic) {
                    await this.pbxQueueStatisticService.transferStatic({
                      callId: callId,
                      tenantId: tenantId,
                      queueNumber,
                    });
                  }
                  await this.pbxQueueStatisticService.hangupCall(
                    callId,
                    tenantId as number,
                    queueNumber,
                    HangupCase.BY_AGENT,
                  );
                  //this.alegHangupBy = 'agent';
                  const roommId = originationUuid
                    ? `${callId}_${originationUuid}`
                    : callId;
                  //this.R.service.queue.hangupBy({ tenantId, callId: roommId, hangupBy: 'agent' });

                  if (
                    !isCallerHangup &&
                    queueOption &&
                    queueOption.transferStatic
                  ) {
                    this.runtimeData.setStatisData({
                      sType: 'queue',
                      agentId: agentId,
                      answerTime: answerTime,
                      agentNumber: whoAnswered,
                      agentLeg: originationUuid,
                      ringTime: ringTime,
                      queueName,
                      queueNumber,
                    });
                    // TODO 从配置文件中读取满意度IVR
                    // _this.R.satisData.gotoIvrNumber = 166;
                    // _this.R.satisData.gotoIvrActId = 1;
                    result.gotoIvrNumber = '166';
                    result.gotoIvrActId = 1;

                    //_this.R.transferData.afterTransfer = 'satisfaction';
                  }
                }
                resolve(null);
              } catch (ex) {
                reject(ex);
              }
            };

            const onCallerHangup = async (evt: any) => {
              try {
                this.logger.debug(
                  'CCQueueService',
                  'FIND_QUEUE_MEMBER_DONE中监听到主叫挂机了!',
                );
                const { originationUuid } =
                  this.runtimeData.getQueueData(conn_id);
                this.runtimeData.setQueueData(conn_id, {
                  isCallerHangup: true,
                });
                if (!doneOver) {
                  doneOver = true;

                  this.runtimeData.setStatisData({ hangup: true });
                  result.callerHangup = true;
                  const timestamp = new Date().getTime();

                  await this.pbxAgentStatisticService.hangupCall({
                    callId: callId,
                    bLegId: originationUuid,
                    hangupCase: 'user',
                  });
                  await this.pbxQueueStatisticService.hangupCall(
                    callId,
                    tenantId as number,
                    queueNumber,
                    HangupCase.BY_USER,
                  );

                  // _this.R.alegHangupBy = 'visitor';

                  //  _this.R.service.queue.hangupBy({ tenantId, callId: `${callId}_${_this.R.originationUuid}`, hangupBy: _this.R.alegHangupBy });
                  // await doneAfter();
                  // resolve();
                }
              } catch (ex) {
                reject(ex);
              }
            };

            const onDisconnect = async (evt: any) => {
              try {
                if (evt.getHeader('Controlled-Session-UUID') === callId) {
                  if (!doneOver) {
                    this.logger.debug(
                      null,
                      `FIND_QUEUE_MEMBER_DONE ON DISCONNECT!`,
                    );
                    doneOver = true;
                    const dd = evt.getHeader('Linger-Time');

                    if (+dd > 0) {
                      const timed = +dd;
                      setTimeout(() => {
                        resolve(null);
                      }, timed * 1000);
                    }
                    // await doneAfter();
                  }
                }
              } catch (ex) {
                reject(ex);
              }
            };

            const { originationUuid, agentId } =
              this.runtimeData.getQueueData(conn_id);
            this.fsPbx.addConnLisenter(
              conn_id,
              `esl::event::CHANNEL_HANGUP::${originationUuid}`,
              'once',
              onAgentHangup,
            );

            this.fsPbx.addConnLisenter(
              conn_id,
              `esl::event::CHANNEL_HANGUP::${callId}`,
              'once',
              onCallerHangup,
            );

            // TODO 在坐席统计表中,发现挂机由system的原因可能是这里引起的,如果先监听到此事件,是否能从evt中获取到是谁引起的挂机,否者要考虑如何确定
            this.fsPbx.addConnLisenter(
              conn_id,
              'esl::event::disconnect::notice',
              'once',
              onDisconnect,
            );

            //if (tenantInfo && tenantInfo.callCenterOpts && tenantInfo.callCenterOpts.recordCall !== false) {
            // _this.R.recordFiles[.callId] = `${_this.R.callId}`;
            const recordFileName = `${callId}.${originationUuid}`;
            this.fsPbx
              .uuidRecord(
                conn_id,
                callId,
                'start',
                tenantId as number,
                '',
                recordFileName,
              )
              .then((res) => {
                this.logger.debug('CCQueueService', '启动队列录音成功!');
                return this.pbxRecordFileService.create({
                  tenantId: tenantId,
                  direction: callType,
                  callId: callId,
                  filename: `${recordFileName}`,
                  folder: res.folder,
                  agentId: agentId,
                  extension: whoAnswered,
                });
              })
              .catch((err) => {
                this.logger.error('CCQueueService','Queue record error:', err);
              });
            // }

            this.pbxQueueStatisticService
              .answerCall({
                callId: callId,
                tenantId: tenantId,
                queueNumber,
                answerAgent: whoAnswered,
                answerAgentId: agentId,
              })
              .then()
              .catch((err: any) => {
                this.logger.error('CCQueueService','QueueStatistic answerCall error:', err);
              });
          }
        });
        return Promise.resolve(result);
      } 
      else {
        return Promise.reject('Queue is not find in DB!');
      }
    } catch (ex) {
      this.logger.error('CCQueueService','ESL DialQueue Error:', {error:ex});
      return Promise.reject(ex);
    }
  }

  async afterQueueEnd(
    conn_id: string,
    { answered, agentNumber, queueNumber }: any,
  ) {
    // const _this = this;
    // const { tenantId, fsName, fsCoreId, callType, callId, originationUuid, caller, DND, direction, logger, service } = _this.R;
    // const pubData = {
    //   tenantId, agent: agentNumber, state: '', fsName, fsCoreId, callType,
    //   transferCall: _this.R.transferCall,
    //   isClickOut: _this.R.clickOut === 'yes' ? true : false,
    //   agentId: _this.R.agentId,
    //   roomId: _this.R.roomId,
    //   sipCallId: _this.R.pbxApi.getChannelData().sipCallId,
    //   options: {
    //     callId: callId + '_' + _this.R.originationUuid,
    //     callee: agentNumber,
    //     caller,
    //     DND,
    //     direction,
    //   },
    // };
    try {
      this.logger.debug('CCQueueService', 'afterQueueEnd', {
        answered,
        agentNumber,
        queueNumber,
      });
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      await this.pbxExtensionService.setAgentState(
        tenantId as number,
        agentNumber,
        ExtensionSate.idle,
      );
      //   const stateResult = await service.extension.setAgentState(Object.assign({}, pubData, {
      //     state: _this.endState,
      //     fromQueue: 'yes',
      //     answered,
      //     hangup: true,
      //   }));
      if (answered) {
        // _this.R.logger.debug(loggerPrefix, 'afterQueueEnd', stateResult);
        // _this.db.cdrAgentHangup('Queue Agent', 'agent');
        // const endCallRes = await service.agents.endCall({
        //   tenantId,
        //   queueNumber,
        //   agentNumber,
        // });
        // _this.logger.debug(loggerPrefix, 'afterQueueEnd', endCallRes);
      }
      return Promise.resolve('afterQueueEnd done!');
    } catch (ex) {
      this.logger.error('CCQueueService','afterQueueEnd error:', ex);
      return Promise.reject(ex);
    }
  }

  addBullQueueMonitor(conn_id: string) {
    const bullQueue = this.runtimeData.getBullQueue(conn_id);
    if (bullQueue) {
      bullQueue.on('error', (error) => {
        // An error occured.
        this.logger.error('CCQueueService', 'in queue bullqueue error:', {error});
      });
      // this.bullQueue.on('active', (job, jobPromise) => {
      //     // A job has started. You can use `jobPromise.cancel()`` to abort it.
      //     this.logger.debug('CCQueueService','in queue bullqueue active', job.id);
      //     // jobPromise.cancel();
      // })
      // .on('stalled', function (job) {
      //     // A job has been marked as stalled. This is useful for debugging job
      //     // workers that crash or pause the event loop.
      //     console.log('bullqueue stalled')
      // })
      // .on('progress', function (job, progress) {
      //     // A job's progress was updated!
      //     console.log('in queue bullqueue progress')
      // })

      // this.bullQueue.on('global:completed', this.onFindQueueMember.bind(this)); // 感觉多执行了几次
      bullQueue.on('global:failed', (jobId, err) => {
        this.onJobFail(conn_id, jobId, err)
          .then()
          .catch((err) => {});
      });
      // .on('global:failed', function(job, err) {
      //   console.log(`global:failed Job :`,job,err);
      // })
      // .on('cleaned', function(jobs, type) {
      //   // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
      //   // jobs, and `type` is the type of jobs cleaned.
      //   console.log('bullqueue cleaned',type)
      // });
    } else {
      console.log('bullqueue is  undefined');
    }
  }

  async timoutCheck(conn_id: string) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const { startTime, isDoneBusyTip, isDoneTimeoutTip, queue } =
        this.runtimeData.getQueueData(conn_id);
      let busyTipTime = startTime;
      const now = new Date().getTime();
      if (isDoneBusyTip || isDoneTimeoutTip) {
        this.logger.debug('CCQueueService', '有其他提示任务在处理中');
        busyTipTime = now;
        this.runtimeData.setQueueData(conn_id, { startTime: now });
        return;
      }
      const diffTime = now - startTime;
      const busyTipCheckTime = now - busyTipTime;
      this.logger.debug(
        null,
        `queue intervale diffTime=${diffTime},busyTipCheckTime=${busyTipCheckTime}`,
      );
      const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
      const { maxWaitTime, enterTipFile } = queueConf;
      // 超时时处理
      if (
        diffTime > maxWaitTime * 1000 &&
        !isDoneTimeoutTip &&
        !isDoneBusyTip
      ) {
        this.runtimeData.setQueueData(conn_id, { isDoneTimeoutTip: true });
        await this.fsPbx.uuidBreak(conn_id, callId);
        const res = await this.dialQueueTimeOut(conn_id);
        // 客户选择继续等待
        if (res && res.wait) {
          this.runtimeData.setQueueData(conn_id, {
            startTime: new Date().getTime(),
          });

          await this.playQueueMusic(conn_id);
        }
        // 客户挂机
        else {
        }
        this.runtimeData.setQueueData(conn_id, { isDoneTimeoutTip: false });
      }
      // 默认30秒提醒一次
      else if (
        busyTipCheckTime > 30 * 1000 &&
        !isDoneBusyTip &&
        !isDoneTimeoutTip
      ) {
        this.runtimeData.setQueueData(conn_id, { isDoneBusyTip: true });
        this.logger.debug('CCQueueService', '30秒未找到空闲坐席，坐席全部忙');
        const {
          abtFile,
          abtKeyTimeOut = 15,
          abtWaitTime = 30,
          abtInputTimeoutFile,
          abtInputTimeoutEndFile,
          abtInputErrFile,
          abtInputErrEndFile,
          abtTimeoutRetry = 2,
          abtInputErrRetry = -1,
        } = queue?.queueOption as PbxQueueOption;
        await this.fsPbx.uuidBreak(conn_id, callId);
        const res = await this.allBusyTip(conn_id, {
          abtFile,
          abtKeyTimeOut,
          abtWaitTime,
          abtInputTimeoutFile,
          abtInputTimeoutEndFile,
          abtInputErrFile,
          abtInputErrEndFile,
          abtTimeoutRetry,
          abtInputErrRetry,
        });
        this.logger.debug('CCQueueService', `队列全忙，用户是否选择继续等待:${res}`);
        if (res) {
          busyTipTime = new Date().getTime();
          await this.playQueueMusic(conn_id);
        }
        this.runtimeData.setQueueData(conn_id, { isDoneBusyTip: false });
      } else {
        this.logger.debug('CCQueueService', '队列时间检查！');
      }
    } catch (ex) {
      this.logger.error('CCQueueService','队列时间检查,发生异常:', ex);
      //   if (this.setIntervalTimeout) {
      //     clearInterval(this.setIntervalTimeout);
      //   }
    }
  }

  async startFindMemberJob(conn_id: string) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const { addInQueueJobTimes, queue, priority, vipLevel } =
        this.runtimeData.getQueueData(conn_id);
      this.logger.debug(
        'CCQueueService',
        `Start Find Member!Pass ${addInQueueJobTimes} Times!`,
      );
      const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
      const { maxWaitTime, enterTipFile } = queueConf;
      const newPriority = priority > 1 ? priority - 1 : 1;
      this.runtimeData.setQueueData(conn_id, {
        priority: newPriority,
        findQueueMemberExec: false,
      });
      const bullQueue = this.runtimeData.getBullQueue(conn_id);
      if (bullQueue) {
        const queueJob = await bullQueue.add(
          {
            callId: callId,
            tenantId: tenantId,
            queue: queue as PbxQueue,
            timeout: (maxWaitTime + 1) * 1000,
          },
          {
            priority: newPriority < 1 ? 1 : newPriority,
            // jobId: _this.R.callId,
            timeout: (maxWaitTime + 1) * 3 * 1000,
            // timeout: 30 * 1000,
          },
        );
        this.logger.debug('CCQueueService', 'A Find Queue Member To Job:', {
          queueJobId: queueJob ? queueJob.id : 'NULL',
        });
        this.setQueueWaitingInfo(tenantId, queueNumber, queueName);
        // 每隔1秒检查是否超时了

        this.runtimeData.setQueueData(conn_id, {
          isDoneTimeoutTip: false,
          isDoneBusyTip: false,
          queueJob: queueJob,
        });
        // this.setIntervalTimeout = setInterval(this.timoutCheck.bind(this), 1000);
        // VIP用户强行取出当前正在active的普通用户，并插入VIP
        if (vipLevel && vipLevel > 0) {
          await this.insertVip();
        }
        this.runtimeData.setQueueData(conn_id, {
          addInQueueJobTimes: addInQueueJobTimes + 1,
        });
      }
    } catch (ex) {
      this.logger.error('CCQueueService','On Playback startFindMemberJob Error:', {ex});
    }
  }

  async onJobFail(conn_id: string, jobId: any, err: any) {
    try {
      this.logger.info('CCQueueService','queue job fail:', {jobId, err});
      const { queueJob } = this.runtimeData.getQueueData(conn_id);
      if (jobId === queueJob?.id) {
        // 主动发起的结束
        err = typeof err === 'string' ? JSON.parse(err) : err;
        if (err && err.eslSendStop) {
          this.logger.info('CCQueueService','queue job fail222:', {err});
        }
        // 超时的情况
        else if (err && err.maxTimeOut) {
          this.logger.info('CCQueueService','queue job 3333:', {maxTimeOut:err.maxTimeOut});
          const result = await this.dialQueueTimeOut(conn_id);
          if (result.wait) {
            await this.playQueueMusic(conn_id);
            await this.startFindMemberJob(conn_id);
          }
        } else {
          this.logger.info('CCQueueService','queue job 444444:', {err});
        }
      }
      return Promise.resolve();
    } catch (ex) {
      this.logger.error('CCQueueService','On Queue Job Fail :', {ex});
      return Promise.resolve();
    }
  }

  /**
   * 队列放音时开始找坐席，直到找到坐席且与用户桥接成功，除非：
   * 1、主叫挂机
   * 2、找队列等待超时
   * @param job
   * @param data
   */
  async onFindQueueMember(conn_id: string, jobId: any, data: any) {
    const {
      tenantId,
      callId,
      caller,
      callee: called,
      routerLine,
    } = this.runtimeData.getRunData(conn_id);
    const { queueJob, queue, isCallerHangup, originationUuid } =
      this.runtimeData.getQueueData(conn_id);
    try {
      this.logger.debug('CCQueueService', `On Find Queue Member ${jobId} ${queueJob?.id}`);

      if (jobId === queueJob?.id) {
        data = typeof data === 'string' ? JSON.parse(data) : data;
        const agentInfo = data.success ? data.data : null;
        const agentType = this.config.get('sipRegInFS') ? 'user' : 'kamailio';
        const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
        const { maxWaitTime, enterTipFile } = queueConf;
        const result = {
          agentNumber: '',
          success: false,
          answered: false,
          hasDone: false,
        };
        this.runtimeData.setQueueData(conn_id, { findQueueMemberExec: true });
        // if (this.setIntervalTimeout) {
        //   clearInterval(this.setIntervalTimeout);
        // }
        this.logger.debug(
          'CCQueueService',
          'findQueueMemberEvent return:',
          agentInfo,
        );
        result.agentNumber = agentInfo.accountCode;
        if (isCallerHangup) {
          this.logger.info('CCQueueService', 'find one but Caller is hanguped.');
        } else if (agentInfo && agentInfo.accountCode) {
          const startCallAgentTime = new Date();

          this.runtimeData.setQueueData(conn_id, {
            agentId: agentInfo.agentId,
          });
          // 拨打坐席，当坐席应答后桥接坐席和用户，返回桥接后的结果
          this.logger.info('CCQueueService', 'ready to dial QueueMember......');
          const dialResult = await this.dialQueueMember(conn_id, { agentInfo });
          this.logger.debug(
            'CCQueueService',
            'dialQueueMember result:',
            dialResult,
          );
          // 不成功重新放回队列
          if (isCallerHangup) {
            this.logger.info('CCQueueService', 'When find Queue Member, Caller is Hangup');
          } else if (!dialResult.success) {
            await this.startFindMemberJob(conn_id);
          } else {
            this.runtimeData.setQueueData(conn_id, { queueAnswered: true });
            result.success = true;
            result.answered = true;
            result.hasDone = true;
            this.setQueueWaitingInfo(tenantId, queueNumber, queueName);
            // 针对电话签入方式的坐席 在桥接后的一些特殊处理
            if (agentInfo.phoneLogin === 'yes') {
              const { channelName, useContext } =
                this.runtimeData.getChannelData(conn_id);
              const tenantInfo = this.runtimeData.getTenantInfo(conn_id);
              await this.pbxCdrService.createCdr({
                tenantId,
                routerLine: routerLine,
                srcChannel: channelName,
                context: useContext,
                caller: caller,
                called:
                  agentInfo.phoneLogin === 'yes'
                    ? agentInfo.phoneNumber
                    : agentInfo.accountCode,
                callId: originationUuid,
                recordCall: true, //tenantInfo.recordCall,
                isTransfer: false,
                agiType: 'queue-leg',
                isClickOut: false,
                starTime: startCallAgentTime,
                agent: String(agentInfo.accountCode),
                callFrom: '',
                callTo:
                  agentInfo.phoneLogin === 'yes'
                    ? agentInfo.phoneNumber
                    : agentInfo.accountCode,
                answerTime: new Date(),
                answerStatus: AnswerStatus.ANSWERED,
                associateId: [callId],
              });
            }
            // 告诉可以进行坐席接听后的处理了
            this.eventEmitter.emit(`queue::after::bridge::${callId}`, result);
          }
        }
        //
        else {
          this.logger.error('CCQueueService', 'findQueueMemberEvent Error:', {agentInfo});
          // 寻找坐席异常的通知
          if (!isCallerHangup) {
            await this.fsPbx.uuidTryKill(conn_id, callId);
          }
        }
      }
    } catch (error) {
      this.logger.error('CCQueueService','onFindQueueMember Error:', {error});
      if (isCallerHangup) {
        await this.fsPbx.uuidTryKill(conn_id, callId);
      }
    }
  }

  async onFindQueueMemberByRedisPub(conn_id: string, data: any) {
    try {
      const { queueJob} = this.runtimeData.getQueueData(conn_id);
      return await this.onFindQueueMember(conn_id, queueJob?.id, data);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async onCallerHangupHandle(conn_id: string, evt: any) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const {queue, queueAnswered} = this.runtimeData.getQueueData(conn_id);
      const { queueName, queueNumber, queueOption: queueConf, } = queue as PbxQueue;
 
      this.runtimeData.setQueueData(conn_id, { isCallerHangup: true });
      if (queueAnswered) {
        // await this.callerHangupAnswered();
      } else {
        this.logger.debug('CCQueueService', '主叫在接听前挂机了!');
        await this.callerHangupOnWaiting(conn_id);
      }
    } catch (ex) {
      this.logger.error('CCQueueService','Done Caller Hangup ERROR:', ex);
      return Promise.resolve(); //监听的回调不要reject
    }
  }

  /**
   * 主叫在未应答前，挂机
   */
  async callerHangupOnWaiting(conn_id: string) {
    const {
      tenantId,
      callId,
      caller,
      callee: called,
      routerLine,
    } = this.runtimeData.getRunData(conn_id);
    const {queue, originationUuid, hangupBySystem, queueJob} = this.runtimeData.getQueueData(conn_id);
    try {
      const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
      // result.callerHangup = true;
      // result.hasDone = true;
      // if (findQueueMemberExec) {
      //   _this.R.logger.debug(loggerPrefix, '已经找到坐席');
      //   return Promise.resolve();
      // }

      this.logger.debug(
        null,
        `主叫在队列中排队等候中先挂机!hangupBySystem=${hangupBySystem}`,
      );
      // _this.R.EE3.off(findQueueMemberEvent, onFindQueueMember);

      //   if (this.setIntervalTimeout) {
      //     clearInterval(this.setIntervalTimeout);
      //   }

      if (queueJob) {
        const jobState = await queueJob.getState();
        // !== 'stalled' 这个状态在新版本中没有了吗？
        this.logger.debug('CCQueueService', `Tell Bull Queue Stop The Job :${jobState}`);

        if (jobState === 'active') {
          await this.stopFindAgentJob(conn_id, queueJob.id);
        } else {
          await queueJob.remove();
        }
      }

      await this.fsPbx.wait(3000);
      await this.setQueueWaitingInfo(tenantId, queueNumber, queueName);

      // _this.R.service.queue.giveupInQueue({ tenantId, callNum: caller, callId, queueName });
      // _this.R.alegHangupBy = _this.hangupBySystem ? 'system' : 'visitor';
      // _this.R.service.queue.hangupBy({ tenantId, callId: `${callId}_${_this.R.originationUuid}`, hangupBy: _this.R.alegHangupBy });
      // await _this.bullQueue.empty();

      const tasks = [];

      tasks.push(
        this.pbxQueueStatisticService.hangupCall(
          callId,
          tenantId,
          queueNumber,
          HangupCase.ON_RING,
        ),
      );

      tasks.push(
        this.pbxAgentStatisticService.hangupCall({
          callId,
          bLegId: originationUuid,
          hangupCase: HangupCase.ON_RING,
        }),
      );
      tasks.push(
        this.afterQueueEnd(conn_id, {
          answered: false,
          agentNumber: '',
          queueNumber: queueNumber,
        }),
      );
      // 挂掉响铃中的坐席
      if (originationUuid) {
        tasks.push(
          this.fsPbx.uuidTryKill(
          originationUuid,
            `Caller Is Hangup Yet!${originationUuid}`,
          ),
        );
      }
      await Promise.all(tasks);
      this.eventEmitter.emit(`caller::hangup::when::wait::${callId}`);
    } catch (ex) {
      this.eventEmitter.emit(`caller::hangup::when::wait::${callId}`);
      return Promise.reject(ex);
    }
  }

  async onAgentHangup() {
    try {
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async callerHangupAnswered(conn_id: string) {
    try {
      this.logger.debug('CCQueueService', '主叫在接听后挂机了!');
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const {queue, originationUuid, queueDone} = this.runtimeData.getQueueData(conn_id);
      const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
      if (!queueDone) {
        this.runtimeData.setQueueData(conn_id, { queueDone: true });
        this.runtimeData.setStatisData({ hangup: true });

        const timestamp = new Date().getTime();

        await this.pbxAgentStatisticService.hangupCall({
          callId: callId,
          bLegId: originationUuid,
          hangupCase: 'user',
        });
        await this.pbxQueueStatisticService.hangupCall(
          callId,
          tenantId,
          queueNumber,
          HangupCase.BY_USER,
        );
        // _this.R.alegHangupBy = 'visitor';

        //  _this.R.service.queue.hangupBy({ tenantId, callId: `${callId}_${_this.R.originationUuid}`, hangupBy: _this.R.alegHangupBy });
        // await doneAfter();
        // resolve();
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async insertVip() {
    // try {
    //     this.logger.debug(`vipLevel:${vipLevel}`);
    //     const activeJobs = await this.bullQueue.getActive();
    //     this.logger.debug(`activeJobs:${activeJobs.length}`);
    //     const needToReAddJobs = [];
    //     for (let j = 0; j < activeJobs.length; j++) {
    //         const job = activeJobs[j];
    //         const oldJobOpts = job.opts;
    //         const oldJobId = job.id;
    //         if (oldJobOpts.priority > vipPriority && vipJob.id !== oldJobId) {
    //             needToReAddJobs.push(job);
    //         }
    //     }
    //     needToReAddJobs.sort((a, b) => {
    //         return a.opts.timestamp - b.opts.timestamp;
    //     });
    //     while (needToReAddJobs.length) {
    //         const oldJob = needToReAddJobs.shift();
    //         await service.queue.stopFindAgentJob(oldJob.id);
    //         // 不用等待是否结束，就插入进新的队列
    //         // TODO 处理等待那边是否真的结束了该jobId,然后决定是否重新加入队列
    //         const failEventName = `queue::job::fail::${tenantId}::${oldJob.data.callId}::${oldJob.id}`;
    //         logger.debug(loggerPrefix, `failEventName:${failEventName}`);
    //         await new Promise((resolve, reject) => {
    //             let timeOut = false;
    //             let isStoped = false;
    //             EE3.once(failEventName, () => {
    //                 logger.debug(loggerPrefix, `监听到job失败事件:timeOut = ${timeOut}`);
    //                 if (!timeOut) {
    //                     isStoped = true;
    //                     resolve();
    //                 }
    //             });
    //             setTimeout(() => {
    //                 logger.debug(loggerPrefix, `监听到job失败setTimeout函数:isStoped = ${isStoped}`);
    //                 timeOut = true;
    //                 if (!isStoped) {
    //                     reject('等待worker返回fail的结果超过20秒！');
    //                 }
    //             }, 20 * 1000);
    //         });
    //         logger.debug(loggerPrefix, `重新插入active JOB${oldJob.id}到队列排队`);
    //         const reNewJob = await _this.bullQueue.add(oldJob.data, {
    //             priority: oldJob.opts.priority - 1,
    //             // jobId: _this.R.callId,
    //             timeout: oldJob.opts.timeout,
    //             // timeout: 30 * 1000,
    //         });
    //         logger.info('CCQueueService',loggerPrefix, `VIP插队后,原来的job:${oldJob.id}重新插入队列后变成:${reNewJob ? reNewJob.id : 'NULL'}`);
    //         if (needToReAddJobs.length) {
    //             await _this.wait(100);
    //         }
    //     }
    //     return Promise.resolve();
    // } catch (ex) {
    //     return Promise.reject(ex);
    // }
  }

  async playQueueMusic(conn_id: string) {
    try {
      const { tenantId, callId } = this.runtimeData.getRunData(conn_id);
      const {queueMusicFile} = this.runtimeData.getQueueData(conn_id);
      await this.fsPbx.uuidBroadcast(conn_id,callId, queueMusicFile, 'aleg');
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async dialQueueMember(
    conn_id: string,
    {
      agentInfo,
    }: {
      agentInfo: any;
    },
  ): Promise<dialQueueMemberResult> {
    const dialMemberResult: dialQueueMemberResult = {
      success: false,
      reason: '',
    };
    try {
      let pubData = null;
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const {queue, tryCallAgentTimes} = this.runtimeData.getQueueData(conn_id);
      const { phoneNumber, accountCode, phoneLogin, agentId } = agentInfo;
      const { queueName, queueNumber, queueOption: queueConf } = queue as PbxQueue;
      const {
        maxWaitTime,
        enterTipFile,
        forceDND,
        callerId,
        ringTimeOut,
        jobNumberTipFile,
      } = queueConf;
      await this.pbxExtensionService.setAgentLastCallId(
        tenantId,
        accountCode,
        callId,
      );

      let dialStr = `user/${accountCode}`;
      // 多租户使用accountCode@domain

      let loginType = 'web';
      if (phoneLogin === 'yes') {
        if (phoneNumber && phoneNumber.length > 4) {
          const { dnd, gateway } = await this.pbxTenantService.getDialGateWay({
            tenantId,
            callId,
            dnd: callerId,
            forceDND,
          });
          //this.gateway = gateway;
          //this.DND = dnd;

          // if (this.gateway && this.gateway !== '') {
          //     dialStr = `sofia/external/${phoneNumber}@${this.gateway}`;
          // } else {
          //     dialStr = `sofia/external/${phoneNumber}@${tenantId}`;
          // }
          this.runtimeData.setQueueData(conn_id, { agentEndState: 'waiting' });
          loginType = 'phone';

          //this.cgrCategory = 'call_out';
        }
        // 用思科的分机号当做是手机签入
        else {
          // 通过phoneNumber的第一位去匹配路由规则,有一定的局限性
          // try {
          //     const callerId = await _this.R.dbi.router.getCiscoCaller(tenantId, phoneNumber);
          //     const gateway = await _this.R.dbi.trunk.getGatewayByDND(callerId);
          //     if (callerId && gateway && gateway !== '') {
          //         dialStr = `sofia/external/${phoneNumber}@${gateway}`;
          //     } else {
          //         dialStr = `sofia/external/${phoneNumber}@${tenantId}`;
          //     }
          //     _this.endState = AGENTSTATE.waiting;
          //     loginType = 'phone';
          //     _this.cgrCategory = 'call_internal';
          // } catch (ex) {
          //     logger.error('CCQueueService','思科分机发生错误:', ex);
          // }
        }
      }
      // if (agentType == 'user') {
      //     dialStr = `user/${accountCode}`;
      // }

      const originationUuid = await this.fsPbx.createUuid(conn_id);
      this.runtimeData.addBleg(originationUuid, accountCode);
      // _this.R.agentLeg[`${accountCode}`] = _this.R.originationUuid;
      // _this.R.agentId = agentId;

      this.runtimeData.setQueueData(conn_id, { tryCallAgentTimes: tryCallAgentTimes + 1, originationUuid });
      const { FSName, CoreUuid, sipCallId } =
        this.runtimeData.getChannelData(conn_id);
      pubData = {
        tenantId,
        agentId,
        agent: accountCode,
        state: '',
        fromQueue: 'yes',
        fsName: FSName,
        fsCoreId: CoreUuid,
        //callType: callType,
        //transferCall: transferCall,
        isClickOut: false,
        roomId: callId,
        sipCallId: sipCallId,
        // options: {
        //     callId: _this.R.callId + '_' + _this.R.originationUuid,
        //     callee: accountCode,
        //     caller: _this.R.caller,
        //     DND: _this.R.DND,
        //     direction: _this.R.direction,
        // },
      };

      // if (!_this.R.agentId || _this.R.agentId == '') {
      // dialMemberResult.reason = 'ErrorAgentId';
      // return dialMemberResult;
      // throw new Error('ErrorAgentId');
      //this.agentId = '';
      //   }

      await this.pbxCdrService.updateCalled(tenantId, callId, accountCode);

      await this.pbxAgentStatisticService.create({
        callId: callId,
        bLegId: originationUuid,
        tenantId: tenantId,
        queueNumber: queueNumber,
        agentNumber: accountCode,
        agent: agentInfo as PbxAgent,
        ringStart: new Date(),
      });

      await this.pbxExtensionService.setAgentState(
        tenantId,
        agentId,
        ExtensionSate.ringing,
      );
      await this.pbxCallProcessService.create({
        caller: caller,
        called: accountCode,
        tenantId,
        callId,
        processName: 'ringing',
        passArgs: { number: accountCode, agentId },
      });
      await this.pbxAgentService.newCall({
        tenantId,
        queueNumber: queueNumber,
        agentNumber: accountCode,
      });
      // _this.logger.debug(loggerPrefix, 'newcallRes:', newcallRes);
      // 设置呼叫参数
      const originateArgs = [];
      originateArgs.push('ignore_early_media=true');
      originateArgs.push(`originate_timeout=${ringTimeOut}`);

      originateArgs.push(`origination_uuid=${originationUuid}`);
      originateArgs.push('inherit_codec=false');
      originateArgs.push('originate_call=yes');
      originateArgs.push('dial_queuemember=yes');
      originateArgs.push(`originate_tenant=${tenantId}`);
      if (loginType === 'phone') {
        // originateArgs.push(`origination_caller_id_name=${_this.DND}`);
        // originateArgs.push(`origination_caller_id_number=${_this.DND}`);
      } else {
        originateArgs.push(`origination_caller_id_name=${caller}`);
        originateArgs.push(`origination_caller_id_number=${caller}`);
      }
      // 计费相关参数
      // originateArgs.push(`cgr_reqtype=${_this.R.cgrReqType}`);
      // originateArgs.push(`cgr_tenant=${_this.R.tenantId}`);
      // originateArgs.push(`cgr_subject=${_this.R.pbxApi.getChannelData().sipFromUser}`);
      // originateArgs.push('cgr_account=default');
      // originateArgs.push(`cgr_category=${_this.cgrCategory}`);
      // originateArgs.push('cgr_account=default');

      // originateArgs.push(`direction=inbound`);
      // originateArgs.push(`click_dialout=yes`);

      // originateArgs.push('cgr_ignorepark=true');
      // originateArgs.push('cgr_takethis=true');
      // originateArgs.push('process_cdr=true');
      // originateArgs.push(`cgr_destination=${accountCode}`);

      // originateArgs.push('sip_redirect_context=redirected2');

      const argStrs = originateArgs.join(',');
      // 呼叫坐席
      // _this.R.agentId

      this.runtimeData.setQueueData(conn_id, { ringTime: new Date().getTime() });
      const timestamp = new Date().getTime();

      let start = new Date();

      await this.fsPbx.uuidSetvar(conn_id, {
        uuid: callId,
        varname: 'sip_h_X-CID',
        varvalue: sipCallId as string,
      });
      await this.fsPbx.filter(conn_id, 'Unique-ID', originationUuid);
      this.logger.debug('CCQueueService', 'dial a  member dialStr:', {
        dialStr,
      });
      const oriResult = await this.fsPbx.originate(
        conn_id,
        dialStr,
        '&park()',
        argStrs,
        originationUuid,
      );
      this.logger.debug('CCQueueService', 'dial a  member result:', oriResult);
      // 坐席应答
      if (oriResult && oriResult.success) {
        this.runtimeData.setQueueData(conn_id, {answerTime: new Date().getTime()});
        await this.pbxCallProcessService.create({
          caller: caller,
          called: accountCode,
          tenantId,
          callId,
          processName: 'answer',
          passArgs: { number: accountCode, agentId },
        });
        // EE3.emit(`queue::busytip::findagent::${callId}`);
        await this.fsPbx.uuidBreak(conn_id, callId);
        this.runtimeData.setQueueData(conn_id, {agentId});
        await this.pbxExtensionService.setAgentState(
          tenantId,
          agentId,
          ExtensionSate.inthecall,
        );

        // await _this.R.pbxApi.uuidDebugMedia(newId);
        // await _this.R.pbxApi.uuidDebugMedia(_this.R.callId);
        await this.fsPbx.wait(200);
        await this.fsPbx.uuidSetvar(conn_id, {
          // "hangup_after_bridge": false, //无效很奇怪
          uuid: callId,
          varname: 'park_after_bridge',
          varvalue: 'true',
        });
        const dialResult = await this.fsPbx.uuidBridge(
          conn_id,
          callId,
          originationUuid,
        );
        this.logger.debug(
          'CCQueueService',
          'bridge agent and user:',
          dialResult,
        );

        // bridge来电成功
        if (dialResult.success) {
          const timestamp = new Date().getTime();
          //_this.R.roomId = `${callId}_${_this.R.originationUuid}`;
          await this.pbxAgentStatisticService.answerCall({
            callId: callId,
            bLegId: originationUuid,
          });
          await this.pbxAgentService.answerCall({
            tenantId,
            queueNumber: queueNumber,
            agentNumber: accountCode,
          });
          // 在cdr中更新呼叫应答

          await this.pbxCdrService.setAgentId({
            callId: callId,
            tenantId: tenantId,
            accountCode: agentId,
            whenAnswer: true,
            answerUuid: originationUuid,
          });
          dialMemberResult.success = true;

          // 想客户播放工号
          if (jobNumberTipFile) {
            const tipContent = jobNumberTipFile.replace(
              '{accountCode}',
              accountCode,
            );
            // await _this.ttsClient.playback(callId, tipContent, _this.R.pbxApi, 'both');
            await Promise.all([
              // _this.ttsClient.broadcast(callId, tipContent, _this.R.pbxApi, 'aleg'),
              // _this.ttsClient.broadcast(_this.R.originationUuid, tipContent, _this.R.pbxApi, 'aleg'),
            ]);
          }
        }
        // bridge失败
        else {
          // _this.R.service.queue.hangupBy({ tenantId, callId: `${callId}_${_this.R.originationUuid}`, hangupBy: 'visitor' });
          // _this.R.alegHangupBy = 'visitor';
          // _this.R.service.agentStatistics.hangupCall({
          //     callId: _this.R.callId,
          //     bLegId: _this.R.originationUuid,
          //     hangupCase: 'visitor',
          // });
          this.pbxExtensionService.setAgentState(
            tenantId,
            agentId,
            ExtensionSate.idle,
          );
          dialMemberResult.reason = dialResult.reason;
        }
        return dialMemberResult;
      }
      // 呼叫坐席失败
      else {
        const failType = oriResult.failType;
        const timestamp = new Date().getTime();
        // const fluentData = Object.assign({}, _this.callControlMessageOriginData, {
        //     type: 'hangUp-queue',
        //     bLegId: _this.R.originationUuid,
        //     timestamp,
        //     agentId: _this.R.agentId,
        //     agentNumber: String(accountCode),
        //     queueNumber: queueInfo.queueNumber,
        //     queueName: queueInfo.queueName,
        //     tryCall: _this.tryCallAgentTimes,
        //     ringingTime: _this.ringTime,
        //     by: 'agent',
        // });
        // this.logger.debug(`callControlMessageOriginData DialAgentFail ${failType}`, fluentData);
        // process.fluent['callControlMessageOrigin'].log(fluentData);
        let hangupMsg = '超时未接听';

        switch (failType) {
          // 用户忙线中
          case 'USER_BUSY':
            hangupMsg = '用户忙线';
            break;
          // 正常的挂断，比如系统发起的hangup等
          case 'NORMAL_CLEARING':
            break;
          // 用户拒接
          case 'CALL_REJECTED':
            hangupMsg = '用户拒接';
            break;
          case 'USER_NOT_REGISTERED':
            hangupMsg = '用户未注册';
            break;
          default:
            break;
        }
        // _this.R.service.queue.hangupBy({ tenantId, callId: `${callId}_${_this.R.originationUuid}`, hangupBy: 'system' });

        await this.pbxExtensionService.setAgentState(
          tenantId,
          agentId,
          ExtensionSate.idle,
        );
        await this.pbxAgentService.noAnsweredCall({
          tenantId,
          queueNumber: queueNumber,
          agentNumber: accountCode,
        });
        // TODO 将来在这里编写根据呼叫坐席失败的原因，需要处理的业务数据等
        await this.pbxAgentStatisticService.hangupCall({
          callId: callId,
          bLegId: originationUuid,
          hangupCase: 'agent',
        });

        await this.pbxCallProcessService.create({
          caller: caller,
          called: accountCode,
          tenantId,
          callId,
          processName: 'dialAgentFail',
          passArgs: { number: accountCode, agentId, hangupMsg, failType },
        });
        dialMemberResult.reason = failType;
        return dialMemberResult;
      }
    } catch (ex) {
      this.logger.error('CCQueueService','dialMemberResult', {ex});
      //_this.R.service.extension.setAgentState(Object.assign({}, pubData, { state: _this.endState, hangup: true }));
      dialMemberResult.reason = ex.toString();
      return dialMemberResult;
      // DESTINATION_OUT_OF_ORDER
      // CALL_REJECTED
    }
  }

  async stopFindAgentJob(conn_id: string, jobId: number | string) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const data = {
        tenantId,
        callId,
        jobId,
      };
      await this.eventService.pubAReidsEvent(
        'stopFindAgent',
        JSON.stringify(data),
      );
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async enterEmptyQueue(conn_id: string) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      this.logger.debug('CCQueueService', 'Dial Queue When No Agent Login!');
      await this.fsPbx.uuidPlayback(conn_id, {
        uuid: callId,
        terminators: 'none',
        file: 'ivr/8000/ivr-thank_you_for_calling.wav',
      });
      await this.fsPbx.wait(500);
      await this.fsPbx.uuidKill(callId, 'NORMAL_CLEARING');
      return Promise.resolve();
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async allBusyTip(conn_id: string, options: any) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      let {
        abtFile,
        abtKeyTimeOut,
        abtWaitTime,
        abtInputTimeoutFile,
        abtInputTimeoutEndFile,
        abtInputErrFile,
        abtInputErrEndFile,
        abtTimeoutRetry = 2,
        abtInputErrRetry = -1,
      } = options;
      abtFile = abtFile
        ? await this.fillSoundFilePath(abtFile)
        : 'demo/queuetimeout.wav';
      abtInputTimeoutFile = abtInputTimeoutFile
        ? await this.fillSoundFilePath(abtInputTimeoutFile)
        : 'demo/timeoutandhangup.wav';
      abtInputTimeoutEndFile = abtInputTimeoutEndFile
        ? await this.fillSoundFilePath(abtInputTimeoutEndFile)
        : 'ivr/8000/ivr-call_rejected.wav';
      abtInputErrFile = abtInputErrFile
        ? await this.fillSoundFilePath(abtInputErrFile)
        : 'demo/inputerror.wav';
      abtInputErrEndFile = abtInputErrEndFile
        ? await this.fillSoundFilePath(abtInputErrEndFile)
        : 'ivr/8000/ivr-call_rejected.wav';
      const readArgs = {
        min: 1,
        max: 1,
        uuid: callId,
        file: abtFile,
        variableName: 'all_busy_tip_input_key',
        timeout: abtKeyTimeOut * 1000,
        terminators: 'none',
      };
      let reReadDigits = true;
      let continueWait = false;
      let agentAnswered = false;
      //   EE3.once(`queue::busytip::findagent::${callId}`,() => {
      //     agentAnswered = true;
      //     _this.R.logger.debug('CCQueueService','在全忙提示的时候找到坐席且坐席已经接听！');

      //   })
      while (reReadDigits && !agentAnswered) {
        reReadDigits = false;
        // 提示是否继续等待音

        this.logger.debug(
          null,
          `busy tip abtTimeoutRetry=${abtTimeoutRetry},abtInputErrRetry=${abtInputErrRetry} readargs:`,
          readArgs,
        );

        const inputKey = await this.fsPbx.uuidRead(conn_id, readArgs);
        this.logger.debug('CCQueueService', `agent busy tip user input:${inputKey}`);
        if (inputKey === '1') {
          this.logger.debug('CCQueueService', 'abt-用户选择继续等待!');
          continueWait = true; // 坐席全忙,继续等待!
        } else if (inputKey === 'timeout') {
          // 输出超时音

          if (abtTimeoutRetry > 0) {
            await this.fsPbx.uuidPlayback(conn_id, {
              terminators: 'none',
              file: abtInputTimeoutFile,
              uuid: callId,
            });
            // await _this.dialQueueTimeout(queue);
            // await _this.R.pbxApi.uuidBreak(_this.R.callId);
            await this.fsPbx.wait(500);
            abtTimeoutRetry--;
            reReadDigits = true;
          }
        } else {
          // 输入错误音
          if (abtInputErrRetry > 0) {
            await this.fsPbx.uuidPlayback(conn_id, {
              terminators: 'none',
              file: abtInputErrFile,
              uuid: callId,
            });
            // readArgs.soundFile = 'demo/inputerror.wav';
            abtInputErrRetry--;
            reReadDigits = true;
          }
        }
      }
      // if (agentAnswered) {
      //     return continueWait;
      // }
      // else if (!continueWait && (abtTimeoutRetry === 0 || abtInputErrRetry === 0)) {
      //     this.logger.debug('CCQueueService','abt-用户输入错误音');
      //     await this.fsPbx.uuidPlayback({
      //         uuid: callId,
      //         terminators: 'none',
      //         file: abtTimeoutRetry === 0 ? abtInputTimeoutEndFile : abtInputErrEndFile,
      //     });
      //     //this.R.alegHangupBy = 'system';
      //     //this.hangupBySystem = true;
      //     await this.fsPbx.uuidKill(callId);
      // }
      return continueWait;
    } catch (ex) {
      this.logger.error('CCQueueService','allBusyTip-处理是否继续等待音错误:', ex);
    }
  }

  async setQueueWaitingInfo(
    tenantId: number,
    queueNumber: string,
    queueName: string,
  ) {
    try {
    } catch (ex) {}
  }

  async dialQueueTimeOut(conn_id: string) {
    try {
      const {
        tenantId,
        callId,
        caller,
        callee: called,
        routerLine,
      } = this.runtimeData.getRunData(conn_id);
      const {queue} = this.runtimeData.getQueueData(conn_id);
      this.logger.info('CCQueueService', `${tenantId} dial queue time out!`);
      const readArgs = {
        uuid: callId,
        min: 1,
        max: 1,
        file: queue?.queueOption.queueTimeoutFile || 'demo/queuetimeout.wav',
        variableName: 'satisfaction_input_key',
        timeout: 15 * 1000,
        terminators: 'none',
      };
      let reReadDigits = true;
      const result = {
        wait: false,
        error: '',
      };
      let agentAnswered = false;
      // EE3.once(`queue::busytip::findagent::${callId}`, () => {
      //     agentAnswered = true;
      //     _this.R.logger.debug('CCQueueService','在超时提示的时候找到坐席且坐席已经接听！');
      // })
      await this.fsPbx.uuidBreak(conn_id, callId);
      while (reReadDigits && !agentAnswered) {
        reReadDigits = false;
        // 提示是否继续等待音
        this.logger.info('CCQueueService', 'Tip Is Need To Continue Wait!');
        const inputKey = await this.fsPbx.uuidRead(conn_id, readArgs);
        if (inputKey === '1') {
          this.logger.info('CCQueueService', 'User Choice Wait Again!');
          result.wait = true; // 再排队一次
        } else if (inputKey === 'timeout') {
          // 输出超时音
          this.logger.info('CCQueueService', 'Tip When Wait Input A key Timeout!');
          await this.fsPbx.uuidPlayback(conn_id, {
            uuid: callId,
            terminators: 'none',
            file: 'demo/timeoutandhangup.wav',
          });
          await this.fsPbx.wait(500);
          // _this.R.alegHangupBy = 'system';
          // _this.hangupBySystem = true;
          await this.fsPbx.uuidKill(callId, 'Dial Queue Timeout!');
          result.error = 'Dial Queue Timeout!';
        } else {
          // 输入错误音
          this.logger.debug('CCQueueService', 'Tip User Input A Error Key!');
          readArgs.file = 'demo/inputerror.wav';
          reReadDigits = true;
        }
      }
      return Promise.resolve(result);
    } catch (ex) {
      this.logger.error('CCQueueService','dialMemberTimeOut:', ex);
      return Promise.reject(ex);
    }
  }
  async fillSoundFilePath(file: any) {
    try {
      // const _this = this;
      // const {dbi, tenantId} = _this.R;
      // let resFile = '';
      // let filePrefix = _this.R.config.s3FileProxy ? 'http_cache://' + _this.R.config.s3FileProxy : '/usr/local/freeswitch/files/';
      // if (ObjectID.isValid(file)) {
      //   const soundFileObj = await dbi.sound.get(tenantId, file);
      //   if (soundFileObj) {
      //     resFile = filePrefix + soundFileObj.url;
      //   } else {
      //     resFile = file;
      //   }
      // }
      // else if (/^http/.test(file)) {
      //   resFile = 'http_cache://' + file;
      // }
      // else {
      //   resFile = file;
      // }
      // _this.R.logger.debug('CCQueueService','fillSoundFilePath:', resFile);
      // return resFile;
      return file;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
