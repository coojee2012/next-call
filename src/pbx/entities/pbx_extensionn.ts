import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

// 签入状态 embedPhone电话条,softPhone软电话like:sipLite,physicalPhone:Avaya IP话机 OR Cisco IP话机
export enum ExtensionLoginType {
    EMBED = 'embedPhone',
    SOFT = 'softPhone',
    PHYSICAL = 'physicalPhone',
  }
  export enum ExtensionSate {
   waiting = 'waiting',
   busy = 'busy',
   rest = 'rest',
   idle = 'idle',
   toringing = 'toringing',
   ringing = 'ringing',
   dialout = 'dialout',
   callagent ='callagent', // 双向外呼时,正在呼叫坐席的分机或手机
   inthecall = 'inthecall',
   toconsult ='toconsult',  // 发起咨询
   consulting ='consulting',  // 咨询中
   holding ='holding',  //保持中
   beingconsulted ='beingconsulted',  //坐席分机正在被咨询中
   inivrtransfer ='inivrtransfer' ,  // 当前坐席将来电转入IVR中,正在等待
   inappointtransfer ='inappointtransfer' , // 当前坐席正在与指定转接方通话
   
  }

@Entity('pbx_extensionn')
export class PbxExtensionn extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  accountCode: string; //账号,分机号
  @Column({ nullable: false })
  password: string;
  @Column({ default: 0 })
  agentId: number;
  @Column({default: ''})
  deviceProto: string; //设备协议
  @Column({default: ''})
  deviceNumber: string; // 设备号
  @Column({
    type: 'enum',
    enum: ExtensionLoginType,
    default: ExtensionLoginType.EMBED,
  })
  loginType: ExtensionLoginType;
  @Column({
    type: 'enum',
    enum: ExtensionSate,
    default: ExtensionSate.busy,
  })
  state: ExtensionSate; //坐席状态
  @Column({default: ''})
  deviceString: string; //设备字符串
  @Column({default:false})
  firstChecked: boolean; //是否检查过
  @Column({default: ''})
  transferNumber: string; //随行号码,一般是手机
  @Column({default: ''})
  phoneNumber: string;
  @Column({default: ''})
  lastCallId: string; // 最后一次参与的callID
  @Column({default: ''})
  logicType: string; // 处于的业务逻辑
  @Column({type: 'simple-json'})
  logicOptions: string; // 处于的业务逻辑的参数
  @Column({default: 'no'})
  phoneLogin: string;
  @Column({default: 'off'}) 
  dndInfo: string; //示忙状态 off/on
  @Column({default: 'deailway=hangup&number='})
  failed: string; // deailway-呼叫失败处理方式:hangup,ivr,voicemail,fllowme,transfer
  @Column({default: null, nullable:true})
  stateLastModified:Date;
  @Column({default: null, nullable:true})
  statusLastModified:Date;
}
