import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  OneToMany,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_queue_option')
export class PbxQueueOption {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({default: 'round-robin'})
  strategy: string;
  @Column({default: 'local_stream://moh'})
  mohSound: string;
  @Column({default: '$${base_dir}/recordings/'})
  recordTemplate: string;
  @Column({default: 'queue'})
  timeBaseScore: string;
  @Column({default: true})
  tierRulesApply: boolean;
  @Column({default: 0})
  tierRuleWaitSecond: number;
  @Column({default: false})
  tierRuleWaitMultiplyLevel: boolean;
  @Column({default: false})
  tierRuleNoAgentNoWait: boolean;
  @Column({default: 0})
  discardAbandonedAfter: number;
  @Column({default: false})
  abandonedResumeAllowed: boolean;
  @Column({default: 120})
  maxWaitTime: number;
  @Column({default: 0})
  maxWaitTimeWithNoAgent: number;
  @Column({default: 5})
  maxWaitTimeWithNoAgentTimeReached: number;
  @Column({default: 10})
  ringProgressivelyDelay: number;
  @Column({default: true})
  transferStatic: boolean;
  @Column({default: 'demo/queuetimeout.wav'})
  queueTimeoutFile: string;
  @Column({default: 'demo/satisfaction.wav'})
  satisfactionFile: string;
  @Column({default: ''})
  jobNumberTipFile: string; // 播放工号
  @Column({default: ''})
  enterTipFile: string; // 进入队列提醒
  @Column({default: 30})
  ringTimeOut: number;
  @Column({default: 'demo/satisfaction-thks.wav'})
  verySatisfactionPlay: string; //如果为空就不播放
  @Column({default: ''})
  callerId: string; // 当坐席转接到手机时 外呼显示的中继的号码,这个将影响中继的线路选择
  @Column({default: false})
  forceDND: boolean;

  //坐席全忙相关
  @Column({default: ''})
  abtFile: string;
  @Column({default: 0})
  abtKeyTimeOut: number;
  @Column({default: 0})
  abtWaitTime: number;
  @Column({default: ''})
  abtInputTimeoutFile: string;
  @Column({default: ''})
  abtInputTimeoutEndFile: string;
  @Column({default: ''})
  abtInputErrFile: string;
  @Column({default: ''})
  abtInputErrEndFile: string;
  @Column({default: 0})
  abtTimeoutRetry: number;
  @Column({default: 0})
  abtInputErrRetry: number;
}
