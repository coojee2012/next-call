import { Injectable } from '@nestjs/common';
import { PbxExtensionn, ExtensionSate } from '../entities/pbx_extensionn';
import { Like, Repository } from 'typeorm';
import { BaseService } from 'src/common/BaseService';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/logger/logger.service';
import * as xml from 'xmlbuilder';
import * as crypto from 'crypto';
import { orderBy } from 'lodash';
@Injectable()
export class PbxExtensionnService extends BaseService<PbxExtensionn> {
  private DialString: string;
  constructor(
    @InjectRepository(PbxExtensionn) repository: Repository<PbxExtensionn>,
    private readonly logger: LoggerService,
  ) {
    super(repository);
    this.DialString = '{^^:sip_invite_domain=${dialed_domain}:presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(*/${dialed_user}@${dialed_domain})}';
  }
 


  // override async create(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { tenantId } = req.params;
  //     req.checkBody({
  //       accountCode: {
  //         notEmpty: true,
  //         matches: {
  //           options: /^[1-9]\d{3}$/,
  //           errorMessage: '分机号应该为1-9开头的四位数字', // Error message for the validator, takes precedent over parameter message
  //         },
  //         errorMessage: '分机号不能为空',
  //       },
  //       password: {
  //         notEmpty: true,
  //         matches: {
  //           options: /^[a-zA-Z0-9_-]{6,6}$/,
  //           errorMessage: '密码应该由6位【a-zA-Z0-9_-】字符组成', // Error message for the validator, takes precedent over parameter message
  //         },
  //         errorMessage: '密码不能为空',
  //       },
  //     });
  //     const result = await req.getValidationResult();
  //     if (!result.isEmpty()) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: result.array()[0].msg,
  //         },
  //       });
  //       return;
  //     }

  //     const newExtension = new this.mongoDB.models.PBXExtension({
  //       accountCode: req.body.accountCode,
  //       password: req.body.password,
  //       tenantId,
  //     });

  //     // 保存用户账号
  //     newExtension.save((err, exten: PBXExtensionModel) => {
  //       if (err) {
  //         return next(err);
  //       }
  //       res.json({
  //         meta: {
  //           code: 200,
  //           message: '成功创建新用户!',
  //         },
  //         data: exten,
  //       });
  //     });
  //   } catch (ex) {
  //     return next(ex);
  //   }
  // }

  async assignToUser(tenantId: number, userId: number, accountCode: string) {
    try {
      const updateRes = await this.updateOne(
        {
          tenantId,
          accountCode,
        },
        {
          agentId: userId as number,
        },
      );
      return updateRes;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async mutilCreate(
    tenantId: number,
    start: number,
    end: number,
    password: string,
  ) {
    try {
      const usedExtensions = await this.findBy(
        { tenantId },
      );
      const useds: string[] = [];
      usedExtensions.forEach((item) => {
        useds.push(item.accountCode);
      });
      this.logger.debug('PBXExtensionService','used extensions:');
      const newExtens = [];
      for (let i = start; i <= end; i++) {
        const exten = `${i}`;
        if (useds.indexOf(exten) === -1) {
          newExtens.push({
            accountCode: exten,
            password: password,
            tenantId,
          });
        }
      }

      const docs = await this.bulkCreate(newExtens);
      return docs;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  // async addmuti(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { tenantId } = req.params;
  //     req.checkBody({
  //       accountCode: {
  //         notEmpty: true,
  //         matches: {
  //           options: /^[1-9]\d{3}\-[1-9]\d{3}$/,
  //           errorMessage: '分机号应该为1-9开头的四位数字', // Error message for the validator, takes precedent over parameter message
  //         },
  //         errorMessage: '分机号不能为空',
  //       },
  //       password: {
  //         notEmpty: true,
  //         matches: {
  //           options: /^[a-zA-Z0-9_-]{6,6}$/,
  //           errorMessage: '密码应该由6位【a-zA-Z0-9_-】字符组成', // Error message for the validator, takes precedent over parameter message
  //         },
  //         errorMessage: '密码不能为空',
  //       },
  //     });
  //     const result = await req.getValidationResult();
  //     if (!result.isEmpty()) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: result.array()[0].msg,
  //         },
  //       });
  //       return;
  //     }

  //     const accountcodes = req.body.accountCode.split('-');
  //     const start = +accountcodes[0];
  //     const end = +accountcodes[1];
  //     if (start - end >= 0) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: '起始分机的值小于结束分机的值',
  //         },
  //       });
  //       return;
  //     }

  //     if (end - start > 50) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: '一次性添加分机不能超过50个',
  //         },
  //       });
  //       return;
  //     }
  //     const docs = await this.mutilCreate(
  //       tenantId,
  //       start,
  //       end,
  //       req.body.password,
  //     );

  //     res.json({
  //       meta: {
  //         code: 200,
  //         message: '批量创建分机成功',
  //       },
  //       data: docs,
  //     });
  //     return;
  //   } catch (ex) {
  //     return next(ex);
  //   }
  // }

  /**
   *
   * @param tenantId
   * @description
   * 队列拨打时 检查坐席是否可被拨打
   * @param accountCode
   */
  async checkAgentCanDail(
    tenantId: number,
    accountCode: string,
  ): Promise<PbxExtensionn | null> {
    try {
      const query = {
        tenantId,
        accountCode,
        state:  ExtensionSate.waiting,
        status: 0//'Login',
      };
      const fields = null;
      const options = {
        lean: true,
      };
      const doc = await this.findOne(
        query,
      );
      return doc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async setAgentLastCallId(
    tenantId: number,
    accountCode: string,
    callId: string,
  ) {
    try {
      const query = {
        tenantId,
        accountCode,
      };
      const setData = {
        lastCallId: callId,
        logicType: '',
        logicOptions: undefined,
      };
      const res = await this.updateOne(query, {
        ...setData,
      });
      return Promise.resolve(res);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * @description
   * 根据分机号更改分机状态
   * @param tenantId
   * @param accountCode
   * @param state
   */
  async setAgentState(tenantId: number, accountCode: string, state: ExtensionSate) {
    try {
      const query = {
        tenantId,
        accountCode,
      };
      const setData = {
        state: state,
        stateLastModified: new Date(),
      };
      const res = await this.updateOne(
        query,
        { ...setData },
      );
      return Promise.resolve(res);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  async getExtenByNumber(tenantId:number, accountCode:string) {
    try {
      const query = {
        tenantId,
        accountCode,
      };
      const doc = await this.findOne(
        query
      );
      return doc;
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  // async delExtension(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { tenantId } = req.params;
  //     req.checkBody({
  //       id: {
  //         notEmpty: true,
  //         errorMessage: '参数id不能为空',
  //       },
  //     });
  //     const query = {
  //       tenantId,
  //       _id: req.body.id,
  //     };
  //     const result = await req.getValidationResult();
  //     if (!result.isEmpty()) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: result.array()[0].msg,
  //         },
  //       });
  //       return;
  //     }

  //     const doc = await this.mongoDB.models.PBXExtension.remove(query);
  //     res.json({
  //       meta: {
  //         code: 200,
  //         message: '删除列表成功',
  //       },
  //       data: null,
  //     });
  //   } catch (ex) {
  //     this.logger.error('extension  del  error', ex);
  //     return next(ex);
  //   }
  // }

  // async checkIn(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const user = (req as any).user;
  //     const { tenantId } = req.params;
  //     const query = {
  //       tenantId,
  //       accountCode: user.extension,
  //     };
  //     const setData = {
  //       status: 'Login',
  //     };

  //     const resuslts = await Promise.all([
  //       this.mongoDB.models.PBXExtension.update(
  //         query,
  //         { $set: setData },
  //         { multi: false },
  //       ),
  //       this.userEventCtr.create(tenantId, 'checkin', user._id),
  //     ]);

  //     res.json({
  //       meta: {
  //         code: 200,
  //         message: '签入成功',
  //       },
  //       data: resuslts[0],
  //     });
  //   } catch (error) {
  //     this.logger.error('extension  checkIn  error', error);
  //     return next(error);
  //   }
  // }

  // async checkOutRest(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const user = (req as any).user;
  //     const { tenantId } = req.params;
  //     const resuslt = await this.checkOut(tenantId, user._id, user.extension);
  //     res.json({
  //       meta: {
  //         code: 200,
  //         message: '签出成功',
  //       },
  //       data: resuslt,
  //     });
  //   } catch (error) {
  //     this.logger.error('extension  checkOutRest  error', error);
  //     return next(error);
  //   }
  // }

  async checkOut(tenantId: number, userId: string, accountCode: string) {
    try {
      const query = {
        tenantId,
        accountCode,
      };
      const setData = {
        status: 1//'Logout',
      };

      const results = await Promise.all([
        this.updateOne(
          query,
          { ...setData },
        ),
        //this.userEventCtr.create(tenantId, 'checkout', userId),
      ]);
      return results[0];
    } catch (error) {
      this.logger.error('extension  checkOut  error', error);
      return Promise.reject(error);
    }
  }

  // async directory(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     //  `a1-hash` param instead. Its value should be an md5sum containing `user:domain:password`.
  //     const {
  //       hostname,
  //       domain,
  //       sip_auth_method,
  //       user,
  //       sip_auth_realm,
  //       tag_name,
  //       key_name,

  //       sip_auth_username,
  //       sip_contact_host,
  //       action,
  //       purpose,
  //       profile,
  //     } = req.body;

  //     const EventCallingFunction = req.body['Event-Calling-Function'];
  //     const EventName = req.body['Event-Name'];
  //     this.logger.debug('PBXExtensionService',
  //       'directory:',
  //       `${JSON.stringify({ EventName, EventCallingFunction, domain, user, action, tag_name, key_name })}`,
  //     );
  //     const cacheMs = 5 * 60 * 1000;
  //     res.set('Content-Type', 'text/xml');
  //     let xmlStr: string = '';

  //     if (EventCallingFunction === 'launch_sofia_worker_thread') {
  //       this.logger.debug('PBXExtensionService',req.body);
  //       // xmlStr = this.fsWriteGate();
  //     }

  //     if (!tag_name) {
  //       xmlStr = this.fsWriteStartupResponse();
  //     } else {
  //       if (tag_name === 'domain' && key_name === 'name') {
  //         const tenantId = domain;
  //         const extenInfo = await this.getExtenByNumber(tenantId, user);
  //         if (EventName === 'REQUEST_PARAMS') {
  //           if (
  //             action === 'sip_auth' &&
  //             EventCallingFunction === 'sofia_reg_parse_auth'
  //           ) {
  //             if (/^visitor_\d+/.test(user)) {
  //               this.logger.debug('PBXExtensionService','访客注册');
  //               xmlStr = this.fsWriteAuthorizationResponse(
  //                 user,
  //                 tenantId,
  //                 '123456',
  //               );
  //             } else if (!extenInfo) {
  //               xmlStr = this.fsWriteNotFoundResponse();
  //               this.logger.debug('PBXExtensionService','not fond user');
  //             } else {
  //               xmlStr = this.fsWriteAuthorizationResponse(
  //                 user,
  //                 tenantId,
  //                 extenInfo.password,
  //               );
  //             }
  //           } else if (
  //             action === 'user_call' &&
  //             EventCallingFunction === 'user_outgoing_channel'
  //           ) {
  //             xmlStr = this.fsWriteDialByUserResponse(domain, user, '');
  //           } else if (EventCallingFunction === 'user_data_function') {
  //             xmlStr = this.fsWriteAuthorizationResponse(
  //               user,
  //               tenantId,
  //               extenInfo.password,
  //             );
  //           } else {
  //             xmlStr = this.fsWriteNotFoundResponse();
  //           }
  //         } else if (
  //           EventName === 'GENERAL' &&
  //           (EventCallingFunction === 'resolve_id' ||
  //             EventCallingFunction === 'voicemail_check_main')
  //         ) {
  //           if (/^visitor_\d+/.test(user)) {
  //             this.logger.debug('PBXExtensionService','访客注册');
  //             xmlStr = this.fsWriteAuthorizationResponse(
  //               user,
  //               domain[0],
  //               '123456',
  //             );
  //           } else {
  //             xmlStr = this.fsWriteAuthorizationResponse(
  //               user,
  //               domain[0],
  //               extenInfo.password,
  //             );
  //           }
  //         } else {
  //           xmlStr = this.fsWriteACLResponse();
  //         }
  //       } else {
  //         xmlStr = this.fsWriteACLResponse();
  //       }
  //     }
  //     res.send(xmlStr);

  //     // else if (action === 'reverse-auth-lookup') {
  //     //     const document = xml.create('document', { encoding: 'utf-8' })
  //     //         .att('type', 'freeswitch/xml')
  //     //         .ele('section', { 'name': 'directory' })
  //     //         .ele('domain', { 'name': `${domain}` })
  //     //         .ele('user', { 'id': `1000` })
  //     //         .ele('params')
  //     //         .ele('param', { 'nam': 'reverse-auth-user', 'value': `${user}` }).up()
  //     //         .ele('param', { 'nam': 'reverse-auth-pass', 'value': `password` }).up()
  //     //     const xmlStr = document.end({ pretty: true })
  //     //     res.send(xmlStr)
  //     // } else {
  //     //     const xmlStr = this.fsWriteNotFoundResponse();
  //     //     res.send(xmlStr)
  //     // }
  //   } catch (ex) {
  //     this.logger.error('fs directory error:', ex);
  //     const xmlStr = this.fsWriteNotFoundResponse();
  //     res.send(xmlStr);
  //   }
  // }

  // async configuration(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     res.set('Content-Type', 'text/xml');
  //     this.logger.debug('PBXExtensionService','configuration', req.body);
  //     const { hostname, section, tag_name, key_name, profile, key_value } =
  //       req.body;

  //     const EventCallingFunction = req.body['Event-Calling-Function'];
  //     const EventName = req.body['Event-Name'];

  //     let xmlStr: string = '';

  //     // 动态加载网关
  //     if (
  //       tag_name === 'configuration' &&
  //       EventName === 'REQUEST_PARAMS' &&
  //       EventCallingFunction === 'config_sofia'
  //     ) {
  //       if (profile === 'external') {
  //         xmlStr = this.fsWrtieExterl();
  //       } else {
  //         xmlStr = this.fsWriteNotFoundResponse();
  //       }

  //       console.log(xmlStr);
  //     } else if (
  //       tag_name === 'configuration' &&
  //       EventName === 'REQUEST_PARAMS' &&
  //       EventCallingFunction === 'launch_sofia_worker_thread' &&
  //       profile === 'external'
  //     ) {
  //       xmlStr = this.fsWrtieExterl();
  //       console.log(xmlStr);
  //     } else {
  //       xmlStr = this.fsWriteNotFoundResponse();
  //     }

  //     res.send(xmlStr);
  //   } catch (ex) {
  //     this.logger.error('fs configuration error:', ex);
  //     const xmlStr = this.fsWriteNotFoundResponse();
  //     res.send(xmlStr);
  //   }
  // }

  fsWriteGate() {
    const document = xml
      .create('profile', { encoding: 'external1222' })
      //.att('type', 'freeswitch/xml')
      //.ele('profile', { name: 'external1222' })
      .ele('gateways')
      .ele('gateway', { name: 'gatTEST' })
      .ele('param', { name: 'username', value: 'freeswitch' })
      .up()
      /// auth realm: *optional* same as gateway name, if blank ///
      .ele('param', { name: 'realm', value: '$${outbound_proxy_host}' })
      .up()
      /// username to use in from: *optional* same as  username, if blank ///
      /// <!--<param name="from-user" value="cluecon"/>-->
      /// domain to use in from: *optional* same as  realm, if blank ///
      /// <!--<param name="from-domain" value="asterlink.com"/>-->
      /// account password *required* ///
      .ele('param', {
        name: 'password',
        value: 'freeswitch@$${outbound_proxy_host}',
      })
      .up()
      /// extension for inbound calls: *optional* same as username, if blank ///
      /// <!--<param name="extension" value="cluecon"/>-->
      /// proxy host: *optional* same as realm, if blank ///
      .ele('param', { name: 'proxy', value: '$${outbound_proxy_host}' })
      .up()
      /// send register to this proxy: *optional* same as proxy, if blank ///
      /// <!--<param name="register-proxy" value="mysbc.com"/>-->
      /// expire in seconds: *optional* 3600, if blank ///
      .ele('param', { name: 'expire-seconds', value: '3600' })
      .up()
      /// do not register ///
      .ele('param', { name: 'register', value: 'true' })
      .up()
      /// which transport to use for register ///
      .ele('param', { name: 'register-transport', value: 'udp' })
      .up()
      /// How many seconds before a retry when a failure or timeout occurs ///
      .ele('param', { name: 'retry-seconds', value: '30' })
      .up()
      /// Use the callerid of an inbound call in the from field on outbound calls via this gateway ///
      .ele('param', { name: 'caller-id-in-from', value: 'false' })
      .up()
      /// extra sip params to send in the contact ///
      .ele('param', { name: 'contact-params', value: '' })
      .up()
      ///  Put the extension in the contact ///
      .ele('param', { name: 'extension-in-contact', value: 'true' })
      .up()
      /// send an options ping every x seconds, failure will unregister and/or mark it down ///
      .ele('param', { name: 'ping', value: '300' })
      .up()
      .ele('param', { name: 'cid-type', value: 'rpid' })
      .up()
      /// rfc5626 : Abilitazione rfc5626 ///
      .ele('param', { name: 'rfc-5626', value: 'true' })
      .up()
      .ele('param', { name: 'dtmf-type', value: 'rfc2833' })
      .up()
      .ele('param', { name: 'dtmf-duration', value: '2000' })
      .up()
      /// rfc5626 : extra sip params to send in the contact ///
      .ele('param', { name: 'reg-id', value: '1' })
      .up()
      .up() //gateway

      // .ele('gateway', { name: 'gatTEST11' }).up()

      .up() // gateways

      .ele('aliases')
      .up() // aliases
      .ele('domains')
      .ele('domain', { name: 'all', alias: 'false', parse: 'true' })
      .up()
      .up() //  <domains>
      .ele('settings')
      .ele('param', { name: 'debug', value: '0' })
      .up()
      .up(); // settings
    const xmlStr = document.end({ pretty: true });
    return xmlStr;
  }

  fsWrtieExterl() {
    const xmlStr = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <document type="freeswitch/xml">
    <section name="configuration">
    <profiles>
   
    <profile name="external">
    <!-- http://wiki.freeswitch.org/wiki/Sofia_Configuration_Files -->
    <!-- This profile is only for outbound registrations to providers -->
    <gateways>
      <X-PRE-PROCESS cmd="include" data="sip_profiles/external/*.xml"/>
      <gateway name="kamailio1">
      /// account username *required* ///
      <param name="username" value="freeswitch"/>
      /// auth realm: *optional* same as gateway name, if blank ///
      <param name="realm" value="$\${outbound_proxy_host}"/>
      /// username to use in from: *optional* same as  username, if blank ///
      <!--<param name="from-user" value="cluecon"/>-->
      /// domain to use in from: *optional* same as  realm, if blank ///
      <!--<param name="from-domain" value="asterlink.com"/>-->
      /// account password *required* ///
      <param name="password" value="freeswitch@$\${outbound_proxy_host}"/>
      /// extension for inbound calls: *optional* same as username, if blank ///
      <!--<param name="extension" value="cluecon"/>-->
      /// proxy host: *optional* same as realm, if blank ///
      <param name="proxy" value="$\${outbound_proxy_host}"/>
      /// send register to this proxy: *optional* same as proxy, if blank ///
      <!--<param name="register-proxy" value="mysbc.com"/>-->
      /// expire in seconds: *optional* 3600, if blank ///
      <param name="expire-seconds" value="3600"/>
      /// do not register ///
      <param name="register" value="true"/>
      /// which transport to use for register ///
      <param name="register-transport" value="udp"/>
      /// How many seconds before a retry when a failure or timeout occurs ///
      <param name="retry-seconds" value="30"/>
      /// Use the callerid of an inbound call in the from field on outbound calls via this gateway ///
      <param name="caller-id-in-from" value="false"/>
      /// extra sip params to send in the contact ///
      <param name="contact-params" value=""/>
      ///  Put the extension in the contact ///
      <param name="extension-in-contact" value="true"/>
      /// send an options ping every x seconds, failure will unregister and/or mark it down ///
      <param name="ping" value="300"/>
      <param name="cid-type" value="rpid"/>
      /// rfc5626 : Abilitazione rfc5626 ///
      <param name="rfc-5626" value="true"/>
        <param name="dtmf-type" value="rfc2833"/>
        <param name="dtmf-duration" value="2000"/>
      /// rfc5626 : extra sip params to send in the contact ///
      <param name="reg-id" value="1"/>
      </gateway>
    </gateways>
  
    <aliases>
      <!--
          <alias name="outbound"/>
          <alias name="nat"/>
      -->
    </aliases>
  
    <domains>
      <domain name="all" alias="false" parse="true"/>
    </domains>
  
    <settings>
      <param name="debug" value="0"/>
      <!-- If you want FreeSWITCH to shutdown if this profile fails to load, uncomment the next line. -->
      <!-- <param name="shutdown-on-fail" value="true"/> -->
      <param name="sip-trace" value="no"/>
      <param name="sip-capture" value="no"/>
      <param name="rfc2833-pt" value="101"/>
      <!-- RFC 5626 : Send reg-id and sip.instance -->
      <!--<param name="enable-rfc-5626" value="true"/> -->
      <param name="sip-port" value="$\${external_sip_port}"/>
      <param name="dialplan" value="XML"/>
      <param name="context" value="public"/>
      <param name="dtmf-type" value="rfc2833"/>
      <param name="dtmf-duration" value="2000"/>
      <param name="inbound-codec-prefs" value="$\${global_codec_prefs}"/>
      <param name="outbound-codec-prefs" value="$\${outbound_codec_prefs}"/>
      <!--<param name="disable-transcoding" value="false"/>-->
      <param name="hold-music" value="$\${hold_music}"/>
      <param name="rtp-timer-name" value="soft"/>
      <!--<param name="enable-100rel" value="true"/>-->
      <!--<param name="disable-srv503" value="true"/>-->
      <!-- This could be set to "passive" -->
      <param name="local-network-acl" value="localnet.auto"/>
      <param name="manage-presence" value="false"/>
  
      <!-- sip outbound proxy  -->
      <param name="outbound-proxy" value="$\${outbound_proxy_host}"/>
  
      <!-- used to share presence info across sofia profiles
           manage-presence needs to be set to passive on this profile
           if you want it to behave as if it were the internal profile
           for presence.
      -->
      <!-- Name of the db to use for this profile -->
      <!--<param name="dbname" value="share_presence"/>-->
      <!--<param name="presence-hosts" value="$\${domain}"/>-->
      <!--<param name="force-register-domain" value="$\${domain}"/>-->
      <!--all inbound reg will stored in the db using this domain -->
      <!--<param name="force-register-db-domain" value="$\${domain}"/>-->
      <!-- ************************************************* -->
  
      <!--<param name="aggressive-nat-detection" value="true"/>-->
      <param name="inbound-codec-negotiation" value="generous"/>
      <param name="nonce-ttl" value="60"/>
      <param name="auth-calls" value="false"/>
      <param name="inbound-late-negotiation" value="true"/>
      <param name="inbound-zrtp-passthru" value="$\${zrtp_secure_media}"/> <!-- (also enables late negotiation) -->
      <!--
          DO NOT USE HOSTNAMES, ONLY IP ADDRESSES IN THESE SETTINGS!
      -->
      <param name="rtp-ip" value="$\${local_ip_v4}"/>
      <param name="sip-ip" value="$\${local_ip_v4}"/>
      <param name="ext-rtp-ip" value="auto-nat"/>
      <param name="ext-sip-ip" value="auto-nat"/>
      <param name="rtp-timeout-sec" value="300"/>
      <param name="rtp-hold-timeout-sec" value="1800"/>
      <!--<param name="enable-3pcc" value="true"/>-->
  
      <!-- TLS: disabled by default, set to "true" to enable -->
      <param name="tls" value="$$\{external_ssl_enable}"/>
      <!-- Set to true to not bind on the normal sip-port but only on the TLS port -->
      <param name="tls-only" value="false"/>
      <!-- additional bind parameters for TLS -->
      <param name="tls-bind-params" value="transport=tls"/>
      <!-- Port to listen on for TLS requests. (5081 will be used if unspecified) -->
      <param name="tls-sip-port" value="$\${external_tls_port}"/>
      <!-- Location of the agent.pem and cafile.pem ssl certificates (needed for TLS server) -->
      <!--<param name="tls-cert-dir" value=""/>-->
      <!-- Optionally set the passphrase password used by openSSL to encrypt/decrypt TLS private key files -->
      <param name="tls-passphrase" value=""/>
      <!-- Verify the date on TLS certificates -->
      <param name="tls-verify-date" value="true"/>
      <!-- TLS verify policy, when registering/inviting gateways with other servers (outbound) or handling inbound registration/invite requests how should we verify their certificate -->
      <!-- set to 'in' to only verify incoming connections, 'out' to only verify outgoing connections, 'all' to verify all connections, also 'subjects_in', 'subjects_out' and 'subjects_all' for subject validation. Multiple policies can be split with a '|' pipe -->
      <param name="tls-verify-policy" value="none"/>
      <!-- Certificate max verify depth to use for validating peer TLS certificates when the verify policy is not none -->
      <param name="tls-verify-depth" value="2"/>
      <!-- If the tls-verify-policy is set to subjects_all or subjects_in this sets which subjects are allowed, multiple subjects can be split with a '|' pipe -->
      <param name="tls-verify-in-subjects" value=""/>
      <!-- TLS version ("sslv23" (default), "tlsv1"). NOTE: Phones may not work with TLSv1 -->
      <param name="tls-version" value="$\${sip_tls_version}"/>
      <!-- param name="odbc-dsn" value="freeswitch::"/ -->
    </settings>
  </profile>
  </profiles>
</section>
</document>
    `;
    return xmlStr;
  }
  fsWtiteGatewayResponse(): string {
    const document = xml
      .create('document', { encoding: 'utf-8' })
      .att('type', 'freeswitch/xml')
      .ele('section', { name: 'configuration' })
      .ele('configuration', {
        name: `sofia.conf`,
        description: 'sofia Endpoint',
      })
      .ele('global_settings')
      .ele('param', { name: 'log-level', value: '0' })
      .up()
      .ele('param', { name: 'debug-presence', value: '0' })
      .up()
      .ele('param', { name: 'session-timeout', value: '1800' })
      .up()
      .up() // global_settings

      .ele('profiles')

      .ele('profile', { name: 'external2' })
      .ele('gateways')
      .ele('gateway', { name: 'gatTEST' })
      .ele('param', { name: 'username', value: 'freeswitch' })
      .up()
      /// auth realm: *optional* same as gateway name, if blank ///
      .ele('param', { name: 'realm', value: '$${outbound_proxy_host}' })
      .up()
      /// username to use in from: *optional* same as  username, if blank ///
      /// <!--<param name="from-user" value="cluecon"/>-->
      /// domain to use in from: *optional* same as  realm, if blank ///
      /// <!--<param name="from-domain" value="asterlink.com"/>-->
      /// account password *required* ///
      .ele('param', {
        name: 'password',
        value: 'freeswitch@$${outbound_proxy_host}',
      })
      .up()
      /// extension for inbound calls: *optional* same as username, if blank ///
      /// <!--<param name="extension" value="cluecon"/>-->
      /// proxy host: *optional* same as realm, if blank ///
      .ele('param', { name: 'proxy', value: '$${outbound_proxy_host}' })
      .up()
      /// send register to this proxy: *optional* same as proxy, if blank ///
      /// <!--<param name="register-proxy" value="mysbc.com"/>-->
      /// expire in seconds: *optional* 3600, if blank ///
      .ele('param', { name: 'expire-seconds', value: '3600' })
      .up()
      /// do not register ///
      .ele('param', { name: 'register', value: 'true' })
      .up()
      /// which transport to use for register ///
      .ele('param', { name: 'register-transport', value: 'udp' })
      .up()
      /// How many seconds before a retry when a failure or timeout occurs ///
      .ele('param', { name: 'retry-seconds', value: '30' })
      .up()
      /// Use the callerid of an inbound call in the from field on outbound calls via this gateway ///
      .ele('param', { name: 'caller-id-in-from', value: 'false' })
      .up()
      /// extra sip params to send in the contact ///
      .ele('param', { name: 'contact-params', value: '' })
      .up()
      ///  Put the extension in the contact ///
      .ele('param', { name: 'extension-in-contact', value: 'true' })
      .up()
      /// send an options ping every x seconds, failure will unregister and/or mark it down ///
      .ele('param', { name: 'ping', value: '300' })
      .up()
      .ele('param', { name: 'cid-type', value: 'rpid' })
      .up()
      /// rfc5626 : Abilitazione rfc5626 ///
      .ele('param', { name: 'rfc-5626', value: 'true' })
      .up()
      .ele('param', { name: 'dtmf-type', value: 'rfc2833' })
      .up()
      .ele('param', { name: 'dtmf-duration', value: '2000' })
      .up()
      /// rfc5626 : extra sip params to send in the contact ///
      .ele('param', { name: 'reg-id', value: '1' })
      .up()
      .up() //gateway

      //.ele('gateway', { name: 'gatTEST11' }).up()

      .up() // gateways

      .ele('aliases')
      .up() // aliases
      .ele('domains')
      .ele('domain', { name: 'all', alias: 'false', parse: 'true' })
      .up()
      .up() //  <domains>
      .ele('settings')
      .ele('param', { name: 'debug', value: '0' })
      .up()
      .up() // settings

      .up(); //profiles

    const xmlStr = document.end({ pretty: true });
    return xmlStr;
  }

  fsWriteStartupResponse(): string {
    const tenants = ['163.com', '263.com']; //TODO 从租户列表获取开通了的租户

    const document = xml
      .create('document', { encoding: 'utf-8' })
      .att('type', 'freeswitch/xml')
      .ele('section', { name: 'directory' });

    tenants.forEach((item) => {
      document
        .ele('domain', { name: `${item}` })
        .ele('params')
        .ele('param', { name: 'dial-string', value: `${this.DialString}` })
        .up()
        .up() // params
        .ele('variables')
        .ele('variable', { name: 'record_stereo', value: 'true' })
        .up()
        .up() // variables
        // .ele('user', { id: 'default110' }).up()// user
        .up(); // domain
    });
    const xmlStr = document.end({ pretty: true });
    return xmlStr;
  }

  fsWriteACLResponse() {
    return this.fsWriteNotFoundResponse();
  }

  fsWriteNotFoundResponse(): string {
    const document = xml
      .create('document', { encoding: 'utf-8' })
      .att('type', 'freeswitch/xml')
      .ele('section', { name: 'result' })
      .ele('result', { status: `not found` });
    const xmlStr = document.end({ pretty: true });
    return xmlStr;
  }

  fsWriteAuthorizationResponse(user:string, domain:string, password: string) {
    const md5 = crypto.createHash('md5');
    const result = md5.update(`${user}:${domain}:${password}`).digest('hex');
    const document = xml
      .create('document', { encoding: 'utf-8' })
      .att('type', 'freeswitch/xml')
      .ele('section', { name: 'directory' })
      .ele('domain', { name: `${domain}` })
      .ele('params')
      .ele('param', { name: 'dial-string', value: `${this.DialString}` })
      .up()

      .up() // params
      .ele('variables')
      .ele('variable', { name: 'accountcode', value: `${user}` })
      .up()
      .ele('variable', { name: 'user_context', value: `default` })
      .up()
      .ele('variable', { name: 'outbound_caller_id_name', value: `${user}` })
      .up()
      .ele('variable', { name: 'outbound_caller_id_number', value: `${user}` })
      .up()
      .ele('variable', { name: 'limit_max', value: '1' })
      .up()
      .ele('variable', { name: 'toll_allow', value: '' })
      .up()
      .up() // <variables>
      .ele('groups')
      .ele('group', { name: 'default' })
      .ele('users')
      .ele('user', { id: `${user}` })
      .ele('params')
      //.ele('param', { 'name': 'password', 'value': `${extenInfo.password}` }).up()
      .ele('param', { name: 'a1-hash', value: `${result}` })
      .up()
      .up()
      .up(); // groups
    const xmlStr = document.end({ pretty: true });
    return xmlStr;
  }

  fsWriteDialByUserResponse(domain:string, user:string, callGroup:string): string {
    const document = xml
      .create('document', { encoding: 'utf-8' })
      .att('type', 'freeswitch/xml')
      .ele('section', {
        name: 'directory',
        description: 'Dynamic User Directory',
      })
      .ele('domain', { name: `${domain}` })
      .ele('params')
      .ele('param', { name: 'dial-string', value: `${this.DialString}` })
      .up()
      .up() // params
      .ele('variables')
      .ele('variable', { name: 'record_stereo', value: 'true' })
      .up()
      .up() // variables
      .ele('groups')
      .ele('group', { name: 'default' })
      .ele('users')
      .ele('user', { id: `${user}` })
      .up() // user
      .up(); // groups
    const xmlStr = document.end({ pretty: true });
    this.logger.debug('PBXExtensionService',xmlStr);
    return xmlStr;
  }

  // async getList(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { tenantId } = req.params;
  //     this.logger.debug('PBXExtensionService',`获取租户${tenantId}的分机列表!`, req.body);
  //     req.checkBody({});
  //     const result = await req.getValidationResult();
  //     if (!result.isEmpty()) {
  //       res.json({
  //         meta: {
  //           code: 422,
  //           message: result.array()[0].msg,
  //         },
  //       });
  //       return;
  //     }
  //     let query = {
  //       tenantId,
  //     };

  //     const fields = null;
  //     const sort = {
  //       accountCode: 1,
  //     };
  //     if (req.body.order) {
  //       sort['accountCode'] = req.body.order.accountCode
  //         ? req.body.order.accountCode
  //         : 1;
  //     }
  //     const options = {
  //       lean: true,
  //       sort,
  //     };
  //     const docs = await this.mongoDB.models.PBXExtension.find(
  //       query,
  //       fields,
  //       options,
  //     );
  //     res.json({
  //       meta: {
  //         code: 200,
  //         message: '获取用户列表成功',
  //       },
  //       data: docs,
  //     });
  //   } catch (ex) {
  //     this.logger.error('extension  list  error', ex);
  //     return next(ex);
  //   }
  // }

  async findMsgAgent(tenantId: number) {
    try {
      const query = {
        tenantId,
        status: 0 //'Login',
      };
      const fields = {
        accountCode: 1,
        agentId: 1,
      };
      const doc = await this.findOne(query as Partial<PbxExtensionn>);

      return doc;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async list(tenantId: number, searchKey: string) {
    try {
      const where: any = {
        tenantId,
        status: 0, // 'Login',
      };
      if (searchKey) {
        where['accountCode'] = Like(`${searchKey}%`);
      }
      const docs = await this.repository.find({
        where,
        order: {
          accountCode: 'ASC',
        },
      });
      return docs;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
}

