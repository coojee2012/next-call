import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { Connection } from './NodeESL/Connection';
import { Event } from './NodeESL/Event';
import { RuntimeDataService } from './runtime-data.service';
import moment = require('moment');
import { error } from 'console';

export type uuidPlayAndGetDigitsOptions = {
  transfer_on_failure?: string;
  digit_timeout?: number;
  regexp: string;
  var_name?: string;
  invalid_file?: string;
  input_err_file?: string;
  input_timeout_file?: string;
  input_err_retry?: number;
  input_timeout_retry?: number;
  inputWhenInvalidTip?: boolean;
  file: string;
  terminators?: string;
  timeout?: number;
  tries?: number;
  max?: number;
  min?: number;
}

export type uuidReadOptions = {
  uuid: string;
  file: string;
  terminators?: string;
  min?: number;
  max?: number;
  variableName?: string;
  timeout?: number;
  legs?: string;
}

export type originateReturn = {
  success: boolean;
  uuid?: string;
  failType?: string;
}

export type uuidBridgeReturn = {
  success: boolean;
  bridgeId?: string;
  reason?: string;
}

export interface IUUIDDualTransfer {
    uuid: string;
    aExten: string;
    aDialplan:string;
    aContext:string;
    bExten:string;
    bDialplan:string;
    bContext:string;
}

@Injectable()
export class FreeSwitchPbxService {
  private lastInputKey: string;
  private initEvent: Event;
  private conn: Connection;
  constructor(private readonly logger: LoggerService, private runtimeData:RuntimeDataService) {
    this.lastInputKey = '';
  }
  initData(event: Event) {
    this.initEvent = event;
  }
  getConnInfo(conn_id:string) {
    const conn = this.runtimeData.getConn(conn_id);
    const isInbound = conn.isInBound();
    this.logger.info(null, 'isInbound', { isInbound });
    return isInbound ? this.initEvent : conn.getInfo();
  }
  /**
   * @description
   * 监听指定的FS事件，FS事件默认返回json字符串
   * event plain ALL
   * event plain CHANNEL_CREATE CHANNEL_DESTROY CUSTOM conference::maintenance sofia::register sofia::expire
   * event xml ALL
   * event json CHANNEL_ANSWER
   * 先执行
   * event plain DTMF
   * 再执行
   * event plain CHANNEL_ANSWER
   * 最终会监听 DTMF 和 CHANNEL_ANSWER 两个事件
   * @param events
   */
  async subscribe(conn_id:string, events: string[]) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.subscribe(events, (evt: Event) => {
          this.logger.debug('FreeSwitchPBXService','subscribe:', {replyText: evt.getHeader('Reply-Text') });
          resolve('');
        });
      });
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','subscribe', {error: ex});
    }
  }
  message(conn_id:string, data: any) {
    const conn = this.runtimeData.getConn(conn_id);
    conn.message(data, (e: any) => {
      //console.log(e.headers);
    });
  }

  async linger(conn_id: string, time: Number) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.sendRecv(`linger ${time}`, (evt: Event) => {
          this.logger.debug('FreeSwitchPBXService','linger:', {replyText: evt.getHeader('Reply-Text') });
          resolve(null);
        });
      });
      return result;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService', 'linger', {error: ex});
    }
  }

  /**
   * @description
   * 指定要侦听的事件类型。注意：这里的过滤不是排除出去而是加入
   * 以下示例将订阅所有事件，然后创建两个过滤器，一个用于侦听HEARTBEATS，另一个用于侦听CHANNEL_EXECUTE事件。
   * events json all
   * filter Event-Name CHANNEL_EXECUTE
   * filter Event-Name HEARTBEAT
   * 现在只会收到HEARTBEAT和CHANNEL_EXECUTE事件。您可以过滤事件中任何的header。要筛选特定channel，您需要使用uuid：
   * filter Unique-ID d29a070f-40ff-43d8-8b9d-d369b2389dfe
   * 要过滤多个唯一ID，您可以为每个UUID添加另一个事件过滤器。
   * filter plain all
   * filter plain CUSTOM conference::maintenance
   * filter Unique-ID $participantB
   * filter Unique-ID $participantA
   * filter Unique-ID $participantC
   * 这会给你参加任何会议的参与者A，B和C的事件。要接收会议中所有用户的事件，您可以使用如下所示的内容：
   * filter Conference-Unique-ID $ConfUUID
   * @param header
   * @param value
   */
  async filter(conn_id:string,header: any, value: any) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      if (conn.isInBound()) {
        return;
      } else {
        const result = await new Promise((resolve, reject) => {
          conn.filter(header, value, (evt: Event) => {
            this.logger.debug('FreeSwitchPBXService','filter:', {replyText: evt.getHeader('Reply-Text') } );
            resolve(null);
          });
        });
        return result;
      }
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','filter', {error:ex});
    }
  }

  /**
   * @description
   * 指定您要撤消过滤器的事件。当某些过滤器错误地应用或者没有使用过滤器时，可以使用过滤器删除。
   * 使用方式：
   * filter delete <EventHeader> <ValueToFilter>
   * 比如：
   * filter delete Event-Name HEARTBEAT
   * 现在，你将不再收到HEARTBEAT事件。您可以删除以这种方式应用的任何过滤器。
   * filter delete Unique-ID d29a070f-40ff-43d8-8b9d-d369b2389dfe
   * 这是删除为给定的唯一标识符应用的过滤器。在此之后，您将不会收到任何此唯一ID的事件。
   * filter delete Unique-ID
   * 这会删除基于unique-id应用的所有过滤器。
   */
  async filterDelete() {}

  /**
   * outbound模式下应答采用的uuid直接从通道变量获得
   */
  async answer(conn_id:string, uuid?: string): Promise<any> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.execute('answer', '', uuid, (evt: Event) => {
          console.log('Answer -> ', evt);
          resolve(null);
        });
      });
      return Promise.resolve(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /*
  预应答命令会在通道建立SDP之前发送，这样可以减少通道建立时间。
  预应答命令的格式为：
  <action> <args> [uuid]
  其中action为pre_answer，args为空，uuid为通道的uuid。
  示例：
  pre_answer
  预应答命令执行成功后，通道的状态会变为pre_answering。
  然后，可以发送answer命令，通道的状态会变为answering。
  ****/
  async pre_answer(conn_id:string, uuid?: string): Promise<any> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.execute('pre_answer', '', uuid, (evt: Event) => {
          console.log('pre_answer -> ', evt);
          resolve(null);
        });
      });
      return Promise.resolve(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async unpark(conn_id:string, uuid?: string): Promise<any> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.execute('unpark', '', uuid, (evt: Event) => {
          console.log('unpark -> ', evt);
          resolve(null);
        });
      });
      return Promise.resolve(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * outbound模式下应答采用的uuid直接从通道变量获得
   */
  async startDTMF(conn_id:string, uuid?: string): Promise<any> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.execute('start_dtmf', '', uuid, (evt: Event) => {
          //  console.log('Answer -> ',evt);
          resolve(null);
        });
      });
      return Promise.resolve(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async getChannelVar(conn_id:string, varname: string, uuid: string): Promise<string> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise<string>((resolve, reject) => {
        conn.api('uuid_getvar', [uuid, varname], (evt: Event) => {
          const value: string = evt.body;
          resolve(value);
        });
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async getRegExtension(conn_id:string): Promise<string> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise<string>((resolve, reject) => {
        conn.api(
          'sofia',
          ['status', 'profile', 'internal', 'reg'],
          (evt: Event) => {
            const value: string = evt.body;
            resolve(value);
          },
        );
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidPlayAndGetDigits(conn_id:string, {
    uuid,
    options,
    includeLast = false,
  }: {
    uuid: string;
    options: uuidPlayAndGetDigitsOptions;
    includeLast: boolean;
  }) {
    try {
      let {
        transfer_on_failure,
        digit_timeout = 10 * 1000,
        regexp,
        var_name,
        input_err_file,
        inputWhenInvalidTip,
        input_err_retry = 3,
        input_timeout_file,
        input_timeout_retry = 3,
        file,
        terminators = '#',
        timeout = 30,
        tries = 3,
        max = 1,
        min = 1,
      } = options;
      const readArgs = {
        uuid,
        min: min,
        max: max,
        file,
        variableName: var_name,
        timeout: digit_timeout,
        terminators: terminators,
      };

      input_err_retry = input_err_retry < 1 ? 3 : input_err_retry;
      input_timeout_retry = input_timeout_retry < 1 ? 3 : input_timeout_retry;
      let inputKeys = '';
      let success = false;
      while (input_err_retry > 0 && input_timeout_retry > 0) {
        tries--;
        this.logger.debug(
          'FreeSwitchPBXService',
          `uuidPlayAndGetDigits:input_err_retry[${input_err_retry}],input_timeout_retry${input_timeout_retry}`,
        );
        const res = await this.uuidRead(conn_id, readArgs);
        regexp = regexp ? regexp : '\\d+';
        const reg = new RegExp(regexp);
        if (res && res !== 'timeout' && reg.test(res)) {
          inputKeys = res;
          success = true;
          break;
        } else if (res && res === 'hangup') {
          break;
        } else {
          let tipFile;
          if (res == 'timeout') {
            this.logger.debug('FreeSwitchPBXService', `uuidPlayAndGetDigits:timeout`);
            tipFile = input_timeout_file
              ? input_timeout_file
              : 'demo/timeout.wav';
            input_timeout_retry--;
          } else {
            this.logger.debug('FreeSwitchPBXService', `uuidPlayAndGetDigits:inputerror`);
            tipFile = input_err_file ? input_err_file : 'demo/inputerror.wav';
            input_err_retry--;
          }
          if (
            !inputWhenInvalidTip &&
            input_err_retry > 0 &&
            input_timeout_retry > 0
          ) {
            await this.uuidPlayback(conn_id, {
              uuid,
              terminators: 'none',
              file: tipFile,
            });
          } else {
            readArgs.file = tipFile;
          }
        }
      }

      if (success) {
        if (includeLast) {
          inputKeys = `${this.lastInputKey}${inputKeys}`;
        }
        if (inputKeys && inputKeys.length) {
          this.lastInputKey = inputKeys[inputKeys.length - 1];
        }
      } else {
        inputKeys = '_invalid_';
      }

      if (var_name) {
        await this.uuidSetvar(conn_id, {
          uuid,
          varname: var_name,
          varvalue: inputKeys,
        });
      }
      this.logger.debug('FreeSwitchPBXService', `uuidPlayAndGetDigits inputKeys:${inputKeys}`);
      return inputKeys;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','uuidReadDigits', {error: ex});
      return Promise.reject(ex);
    }
  }

  async uuidPlayback(conn_id:string, {
    uuid,
    file,
    terminators = 'none',
    legs = 'aleg',
    async = false,
  }: {
    uuid: string;
    file: string;
    terminators?: string;
    legs?: string;
    async?: boolean;
  }) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const getTerminatorsKey = (evt:any) => {
        const input = evt.headers.get('DTMF-Digit');
        this.logger.debug('FreeSwitchPBXService','DTMF-Digit:', {evt});
        if (input == terminators) {
          this.uuidBreak(conn_id, uuid);
        }
      };
      await this.uuidBroadcast(conn_id, uuid, file, legs);

      const playResult = await new Promise((resolve, reject) => {
        if (terminators && terminators !== 'none') {
          conn.on(`esl::event::DTMF::${uuid}`, getTerminatorsKey);
        }
        // PLAYBACK_START
        conn.once(`esl::event::PLAYBACK_START::${uuid}`, (evt) => {
          this.logger.debug('FreeSwitchPBXService','uuidPlay start:', {evt});
        });
        conn.once(`esl::event::PLAYBACK_STOP::${uuid}`, (evt) => {
          const stopReason = evt.headers.get('Playback-Status');
          this.logger.debug('FreeSwitchPBXService','uuidPlay stop:', {evt});
          resolve(stopReason);
        });
      });
      if (terminators && terminators !== 'none') {
        conn.off(`esl::event::DTMF::${uuid}`, getTerminatorsKey);
      }
      return playResult;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','uuidPlayback', {error: ex});
      return Promise.reject(ex);
    }
  }

  async createUuid(conn_id:string): Promise<string> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const newUuid: string = await new Promise<string>((resolve, reject) => {
        conn.api('create_uuid', '', (evt:any) => {
          this.logger.debug('FreeSwitchPBXService','create_uuid', evt.getHeader('Application'));
          const body = evt.getBody();
          if (body != '') {
            resolve(body);
          } else {
            reject(body);
          }
        });
      });
      return newUuid;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','createUuid error:', {error: ex});
      return Promise.reject(ex);
    }
  }

  async originate(
    conn_id:string,
    dialStr: string,
    appOrExten: string = 'park',
    argStrs?: string,
    originationUuid?: string,
  ): Promise<originateReturn> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result: originateReturn = await new Promise<originateReturn>(
        (resolve, reject) => {
          conn.bgapi(
            'originate',
            [`{${argStrs}}${dialStr}`, appOrExten],
            (evt:any) => {
              const body = evt.getBody();
              this.logger.debug('FreeSwitchPBXService','after originate:', {body});
              if (/^\+OK/.test(body)) {
                const newId = body.split(/\s+/)[1];
                resolve({
                  success: true,
                  uuid: newId,
                });
              } else {
                resolve({
                  success: false,
                  failType: body.split(/\s+/)[1],
                });
              }
            },
          );
        },
      );
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidRead(conn_id:string, {
    uuid,
    file,
    terminators = 'none',
    min = 1,
    max = 1,
    variableName,
    timeout = 30000,
    legs = 'aleg',
  }: uuidReadOptions) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      let inputs = '';
      let playStoped = false;
      let isTimeOut = false;
      let isOver = false; //是否接收按键结束
      let channelHangup = false;
      const getTerminatorsKey = async (evt:any) => {
        const input = evt.headers.get('DTMF-Digit');
        this.logger.debug('FreeSwitchPBXService', `DTMF-Digit:${input},playStoped:${playStoped}`);
        // 一旦接收到按键信息,立即终止播放音乐
        if (!playStoped) {
          await this.uuidBreak(conn_id, uuid);
        }
        if (input == terminators) {
          isOver = true;
        } else if (inputs == 'timeout') {
          isOver = true;
        } else if (isOver) {
          this.logger.debug('FreeSwitchPBXService', '按键接收已完毕多余按键将忽略！');
          return;
        } else {
          inputs = `${inputs}${input}`;
          if (inputs && inputs.length == max) {
            isOver = true;
          }
        }
      };

      const onCallHangup = () => {
        this.logger.debug('FreeSwitchPBXService', ` uuidRead CHANNEL_HANGUP  ${uuid}!`);
        isOver = true;
        channelHangup = true;
      };
      conn.once(`esl::event::CHANNEL_HANGUP::${uuid}`, onCallHangup);

      // PLAYBACK_START
      conn.once(`esl::event::PLAYBACK_START::${uuid}`, (evt) => {
        this.logger.debug('FreeSwitchPBXService', `uuidPlay start ${uuid}!`);
      });
      conn.on(`esl::event::DTMF::${uuid}`, getTerminatorsKey);
      await this.uuidBroadcast(conn_id, uuid, file, legs);
      await new Promise((resolve, reject) => {
        const startOnHangup = () => {
          if (!playStoped) {
            playStoped = true;
            isOver = true;
            inputs = 'hangup';
            this.logger.debug('FreeSwitchPBXService', `uuidPlay when hangup ${uuid}`);
            resolve(null);
          }
        };
        conn.once(`esl::event::PLAYBACK_STOP::${uuid}`, (evt) => {
          if (!playStoped) {
            playStoped = true;
            conn.removeListener(
              `esl::event::CHANNEL_HANGUP::${uuid}`,
              startOnHangup,
            );
            const stopReason = evt.headers.get('Playback-Status');
            this.logger.debug('FreeSwitchPBXService', `uuidPlay stop ${uuid}:`, {stopReason});
            resolve(stopReason);
          }
        });
        conn.once(`esl::event::CHANNEL_HANGUP::${uuid}`, startOnHangup);
      });

      await this.wait(1 * 1000);

      if (!isOver) {
        this.logger.debug('FreeSwitchPBXService','uuidRead等待超时处理');

        await new Promise((resolve, reject) => {
          let time = process.hrtime();
          /* let timeRef = setInterval(() => {
           const diff = process.hrtime(time);
           this.logger.debug(`uuidRead检查超时:${diff}`);
           if (isOver || diff[0] * 1000 > timeout) {
           clearInterval(timeRef);
           timeRef = null;
           isOver = true;
           resolve(null);
           }
           }, 1000);*/
          const checkTimeout = () => {
            const diff = process.hrtime(time);
            // this.logger.debug(`uuidRead检查超时:diff = ${diff[0] * 1000} ,timeout=${timeout}`);
            if (isOver) {
              resolve(null);
            } else if (diff[0] * 1000 > timeout) {
              isOver = true;
              inputs = 'timeout';
              resolve(null);
            } else {
              process.nextTick(() => {
                setTimeout(checkTimeout, 500);
              });
            }
          };
          checkTimeout();
        });
      }

      this.logger.debug('FreeSwitchPBXService',`uuidRead等待超时处理完毕:${inputs}`);

      conn.removeListener(`esl::event::DTMF::${uuid}`, getTerminatorsKey);
      conn.removeListener(
        `esl::event::CHANNEL_HANGUP::${uuid}`,
        onCallHangup,
      );
      if (variableName) {
        this.logger.debug('FreeSwitchPBXService',`uuidRead设置通道变量${variableName}=${inputs}`);
        if (!channelHangup) {
          await this.uuidSetvar(conn_id, {
            uuid,
            varname: variableName,
            varvalue: inputs,
          });
        } else {
          this.logger.debug('FreeSwitchPBXService','需要设置通道变量，但是已经挂机了！');
        }
      }
      return inputs;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','uuidRead', {error: ex});
      return Promise.reject(ex);
    }
  }

  async uuidBreak(conn_id:string, uuid: string, flag?: string) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const args = [uuid];
      if (flag && flag === 'all') {
        args.push(flag);
      }
      await new Promise((resolve, reject) => {
        conn.api('uuid_break', args, (evt:any) => {
          // this.logger.debug('FreeSwitchPBXService','uuid_break result:', evt, evt.headers);
          const body = evt.getBody();
          if (/^\+OK/.test(body)) {
            resolve({
              success: true,
              body,
            });
          } else {
            //TODO 不知道是不是有BUG,效果成功了,BODY里面确实ERR
            // this.logger.warn('uuid_break:', body.split(/\s+/)[1]);
            resolve({
              success: true,
              body,
            });
            //reject({success: false, reason: body.split(/\s+/)[1]});
          }
        });
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidSetvar(conn_id:string, {
    uuid,
    varname,
    varvalue,
  }: {
    uuid: string;
    varname: string;
    varvalue: string;
  }) {
    try {
      const result = await new Promise((resolve, reject) => {
        const conn = this.runtimeData.getConn(conn_id);
        conn.api('uuid_setvar', [uuid, varname, varvalue], (evt:any) => {
          const body = evt.getBody();
          this.logger.debug('FreeSwitchPBXService','uuid_setvar result:', {body});
          if (/^\+OK/.test(body)) {
            resolve({
              success: true,
            });
          } else {
            reject({
              success: false,
              reason: body.split(/\s+/)[1],
            });
          }
        });
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidGetvar(conn_id:string, {
    uuid,
    varname,
  }: {
    uuid: string;
    varname: string;
  }): Promise<string> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise<string>((resolve, reject) => {
        conn.api('uuid_getvar', [uuid, varname], (evt:any) => {
          const body = evt.getBody();
          this.logger.debug('FreeSwitchPBXService',' uuid_getvar result:', {body});
          resolve(body);
        });
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidKill(
    conn_id:string, 
    uuid: string,
    cause: string = 'NORMAL_CLEARING',
  ): Promise<string | undefined> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      await new Promise((resolve, reject) => {
        if (conn.socket) {
          conn.api('uuid_kill', [uuid, cause], (evt:any) => {
            const body:string = evt.getBody();
            if (/^\+OK/.test(body)) {
              this.logger.debug('FreeSwitchPBXService',`UUID Kill [ ${uuid} ] OK`);
              resolve(body);
            } else {
              this.logger.debug('FreeSwitchPBXService',`UUID Kill [ ${uuid} ] Fail`);
              reject(body);
            }
          });
        } else {
          resolve('Socket is null!');
        }
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidTryKill(
    conn_id:string, 
    uuid: string,
    cause: string = 'NORMAL_CLEARING',
  ): Promise<string | undefined> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      await new Promise((resolve, reject) => {
        if (conn.socket) {
          conn.api('uuid_kill', [uuid, cause], (evt:any) => {
            const body = evt.getBody();
            if (/^\+OK/.test(body)) {
              this.logger.debug('FreeSwitchPBXService',`UUID Kill [ ${uuid} ] OK!`);
              resolve(null);
            } else {
              this.logger.warn('FreeSwitchPBXService',`UUID Kill [ ${uuid} ] Fail:${body}!`);
              resolve(null);
            }
          });
        } else {
          resolve(`UUID Kill [ ${uuid} ] Socket Is NULL!`);
        }
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * 对特定的uuid异步执行任意拨号计划应用程序。
   * 如果指定了文件名，则将其播放到通道中。
   * Usage: uuid_broadcast <uuid> <path> [aleg|bleg|both]
   * Execute an application on a chosen leg(s) with optional hangup afterwards:
   * Usage: uuid_broadcast <uuid> app[![hangup_cause]]::args [aleg|bleg|both]
   * Examples:
   * uuid_broadcast 336889f2-1868-11de-81a9-3f4acc8e505e sorry.wav both
   * uuid_broadcast 336889f2-1868-11de-81a9-3f4acc8e505e say::en\snumber\spronounced\s12345 aleg
   * uuid_broadcast 336889f2-1868-11de-81a9-3f4acc8e505e say!::en\snumber\spronounced\s12345 aleg
   * uuid_broadcast 336889f2-1868-11de-81a9-3f4acc8e505e say!user_busy::en\snumber\spronounced\s12345 aleg
   * uuid_broadcast 336889f2-1868-11de-81a9-3f4acc8e505e playback!user_busy::sorry.wav aleg
   * @param uuid
   */
  async uuidBroadcast(conn_id:string, uuid:string, pathOrAppStr:any, legs = 'both') {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise((resolve, reject) => {
        conn.api('uuid_broadcast', [uuid, pathOrAppStr, legs], (evt:any) => {
          // this.logger.debug('FreeSwitchPBXService','uuid_broadcast:', evt);
          const body = evt.getBody();
          // this.logger.debug('FreeSwitchPBXService','uuid_broadcast result:', body);
          if (/^\+OK/.test(body)) {
            resolve({
              success: true,
            });
          } else {
            reject({
              success: false,
              reason: body.split(/\s+/)[1],
            });
          }
        });
      });
      return result;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService', 'uuidBroadcast error ', {error: ex});
      return Promise.reject(ex);
    }
  }

  async uuidBridge(conn_id:string, callerLegId:any, agentLegId:any): Promise<uuidBridgeReturn> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result: uuidBridgeReturn = await new Promise<uuidBridgeReturn>(
        (resolve, reject) => {
          conn.api('uuid_bridge', [callerLegId, agentLegId], (evt:any) => {
            const body = evt.getBody();
            this.logger.debug('FreeSwitchPBXService','uuid_bridge result:', {body});
            if (/^\+OK/.test(body)) {
              const bridgeId = body.split(/\s+/)[1];
              resolve({
                success: true,
                bridgeId,
              });
            } else {
              resolve({
                success: false,
                reason: body.split(/\s+/)[1],
              });
            }
          });
        },
      );
      return result;
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','uuidBridge error:', {error: ex});
      return Promise.reject(ex);
    }
  }

  async bridge(
    conn_id:string, 
    uuid:string,
    dialStr:string,
  ): Promise<{ success: boolean; cause: string; evt: Event }> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      const result = await new Promise<{
        success: boolean;
        cause: string;
        evt: Event;
      }>((resolve, reject) => {
        // const dialStr = `sofia/external/${number}@${domain}`;
        conn.executeAsync('bridge', dialStr, uuid, (evt: Event) => {
          this.logger.debug('FreeSwitchPBXService','PBX Bridge A Call:', { eventName: evt.getHeader('Event-Name'), dialStr: dialStr});
          const dialstatus = evt.getHeader('variable_DIALSTATUS');
          if (dialstatus == 'SUCCESS') {
            const cause = evt.getHeader('variable_bridge_hangup_cause');
            resolve({
              success: true,
              cause,
              evt,
            });
          } else {
            this.logger.debug('FreeSwitchPBXService','Bridge FAIL:', {dialstatus});
            resolve({
              success: false,
              cause: dialstatus,
              evt,
            });
          }
        });
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async wait(millisecond:number) {
    try {
      if (millisecond <= 0) {
        millisecond = 3 * 1000;
      }
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(null);
        }, millisecond);
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  addConnLisenter(conn_id:string, evetName: string, eventType: string = 'once', cb?: any) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      if (!cb || typeof cb !== 'function') cb = () => {};
      if (eventType === 'once') {
        conn.once(evetName, (evt) => {cb(conn_id, evt)});
      } else {
        conn.on(evetName, (evt) => {cb(conn_id, evt)});
      }
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService', 'addConnLisenter error:', {ex});
    }
  }

  removeConnLisenter(conn_id:string, evetName: string, cb?: any) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      if (!cb || typeof cb !== 'function') {
        conn.removeAllListeners(evetName);
      } else {
        conn.off(evetName, (evt) => {cb(conn_id, evt)});
      }
    } catch (ex) {
      this.logger.error('addConnLisenter error', ex);
    }
  }

  /**
   * @description
   * 录音控制
   * uuid_record <uuid> [start|stop|mask|unmask] <path> [<limit>]
   * @param uuid
   * @param opt - start,stop,mask,unmask
   * @param tenantId
   * @param 录音路劲,可以是http_cache地址
   * @return {Promise}
   */
  async uuidRecord(
    conn_id:string, 
    uuid: string,
    opt: string,
    tenantId: number,
    path?: string,
    fileName?: string,
  ) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      await this.uuidSetMutilVar(
        conn_id,
        uuid,
        `RECORD_TITLE=YunKeFu;RECORD_COPYRIGHT=YunKeFu;RECORD_SOFTWARE=YunKeFu;RECORD_STEREO=true`,
      );
      path = path || '/usr/local/freeswitch/files/';
      const folder = moment().format('YYYY-MM-DD');
      let name = `${uuid}`;
      if (fileName) {
        name = fileName;
      }
      const recordFileName = `${path}${tenantId}/recordings/${folder}/${name}.wav`;
      const result = await new Promise<{
        folder: string;
        name: string;
        success: boolean;
      }>((resolve, reject) => {
          conn.bgapi('uuid_record', [uuid, opt, recordFileName], (evt:any) => {
          this.logger.debug('FreeSwitchPBXService',recordFileName);
          const body = evt.getBody();
          if (/^\+OK/.test(body)) {
            resolve({ success: true, folder, name });
          } else {
            reject(body);
          }
        });
      });
      return Promise.resolve(result);
    } catch (ex) {
      this.logger.error('FreeSwitchPBXService','uuidRecord error:', {error: ex});
      return Promise.reject(ex);
    }
  }

  async uuidSetMutilVar(conn_id:string, uuid:string, kv:any) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      await this.checkUuid(uuid);
      const result = await new Promise((resolve, reject) => {
        conn.api('uuid_setvar_multi', [uuid, kv], (evt:any) => {
          const body = evt.getBody();
          this.logger.debug('FreeSwitchPBXService',' uuid_setvar_multi result:', {body});
          if (/^\+OK/.test(body)) {
            resolve({
              success: true,
            });
          } else {
            reject({
              success: false,
              reason: body.split(/\s+/)[1],
            });
          }
        });
      });
      return result;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async checkUuid(uuid:string): Promise<boolean> {
    try {
      // if (!uuid || this.hangupedUUID.indexOf(uuid) > -1) {
      //   return Promise.reject(`${uuid}通道已挂断!`);
      // } else {
      //   return Promise.resolve()
      // }
      return true;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidTransfer(
    conn_id:string, 
    uuid: string,
    extension: string,
    leg?: string,
  ): Promise<any> {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      leg = leg || '-bleg';
      const result = await new Promise((resolve, reject) => {
        conn.api(
          'uuid_transfer',
          [uuid, leg, extension, 'xml', 'default'],
          (evt:any) => {
            this.logger.debug('FreeSwitchPBXService','uuid_transfer result:', {evt});
            resolve(null);
          },
        );
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async uuidDualTransfer(conn_id:string, {
    uuid,
    aExten,
    aDialplan = 'xml',
    aContext = 'default',
    bExten,
    bDialplan = 'xml',
    bContext = 'default',
  }: IUUIDDualTransfer) {
    try {
      const conn = this.runtimeData.getConn(conn_id);
      return new Promise((resolve, reject) => {
        conn.api(
          'uuid_dual_transfer',
          [
            uuid,
            `${aExten}/${aDialplan}/${aContext}`,
            `${bExten}/${bDialplan}/${bContext}`,
          ],
          (evt:any) => {
            this.logger.debug(
              `uuid_dual_transfer ${aExten}/${aDialplan}/${aContext} ${bExten}/${bDialplan}/${bContext} result:`,
              evt,
            );
            resolve(evt);
          },
        );
      });
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}
