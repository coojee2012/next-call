import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

export enum AnswerStatus {
  ANSWERED = 'answered',
  NOANSWERED = 'noAnswered',
}

@Entity('pbx_cdr')
@Index(["tenantId", "callId"], { unique: true })
export class PbxCdr extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  callId: string;
  @Column()
  caller: string;
  @Column()
  called: string;

  // 与该通道发生联系的一些通道ID
  @Column("simple-array")
  associateId: string[];
  // 关联的坐席账号
  @Column({ default: '' })
  accountCode: string;
  @Column({ default: '' })
  srcChannel: string;
  @Column({ default: '' })
  desChannel: string;
  // 呼叫来自号码(针对呼入为主叫,呼出为DND)
  @Column({ default: '' })
  callFrom: string;
  // 呼叫去向号码(针对呼入为DND,呼出为被叫)
  @Column({ default: '' })
  callTo: string;
  // 相关的坐席号码
  @Column({ default: '' })
  agent: string;
  @Column({ default: '' })
  threaDID: string;
  @Column({ default: '' })
  context: string;
  @Column({ default: '' })
  sipCallId: string;
  @Column({ default: '' })
  agiType: string;
  @Column({ default: false })
  isClickOut: boolean;
  @Column({ default: false })
  isTransfer: boolean; // 是否是转接呼叫
  @Column({ default: 0 })
  transferTimes: number; // 是否发生过转接
  @Column({ default: false })
  hasConference: boolean; // 是否发生会议
  @Column({ default: false })
  recordCall: boolean; // 是否录音
  @Column({ default: 'yes' })
  alive: string;
  @Column({ default: 'web' })
  loginType: string;
  @Column({default: null, nullable:true})
  starTime: Date;
  @Column({ default: '' })
  lastServiceId: string;
  @Column({ nullable: true })
  lastAppTime: Date; // 上次应用模块发生的时间
  @Column({ nullable: true })
  endTime: Date; // 线路挂断时间
  @Column({ default: '' })
  hangupCase: string;
  @Column({ default: '' })
  hangupBy: string;
  @Column({ default: '' })
  routerLine: string;
  @Column({
    type: 'simple-array',
  })
  extData: string[]; // 扩展参数，用于记录一些特殊业务需要的数据
  @Column({ default: '' })
  lastApp: string;
  @Column({
    type: 'enum',
    enum: AnswerStatus,
    default: AnswerStatus.NOANSWERED,
  })
  answerStatus: AnswerStatus;
  @Column({ default: null, nullable: true })
  answerTime: Date;
}
