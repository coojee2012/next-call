import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

export enum HangupCase {
    BY_USER = 'user',
    BY_AGENT = 'agent',
    ON_RING = 'ring',
    BY_SYSTEM = 'system'
  }

@Entity('pbx_queue_statistic')
export class PbxQueueStatistic extends BaseEntity {
  @Column({ unique: true })
  callId: string;
  @Column()
  tenantId: number;
  @Column()
  queueNumber: string;
  @Column('simple-array')
  onDutyAgents: string[];
  @Column({default: null, nullable:true})
  answerAgent: string; //最终服务坐席分机号
  @Column({default: null, nullable:true})
  answerAgentId: number;
  @CreateDateColumn()
  incomeTime: Date; //进入队列时间
  @Column({default: 0})
  ringTimes: number; //总计呼叫过多少个坐席
  @Column({default: 0})
  ringDuration: number; //总计振铃时长
  @Column({nullable:true, default: null})
  answerTime: Date; //被应答的时间
  @Column({default: null, nullable:true})
  transferStatic: Date; //转满意度的时间
  @Column({nullable:true,default:null})
  hangupTime: Date; //挂机时间
  @Column({
    type: 'enum',
    enum: HangupCase,
    default: HangupCase.BY_SYSTEM
  })
  hangupCase: HangupCase; //用户挂断,坐席挂断,振铃放弃(用户进入队列,未被坐席接听而挂断,包括超时由系统自动挂断)
  @Column({default: -1})
  idleTime: number; //关于该通话,坐席话后处理时间
  @Column({default: 0})
  satisfaction: number; //电话满意度0,1,2,3
}
