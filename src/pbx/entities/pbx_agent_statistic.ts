import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { PbxAgent } from './pbx_agent';

export enum AgentHangupCause { 
  user = 'user',
  agent = 'agent',
  ring = 'ring',
  system = 'system',
}
@Entity('pbx_agent_statistic')
export class PbxAgentStatistic extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  bLegId: string;
  @Column()
  queueNumber: string;
  @Column()
  callId: string;
  @Column()
  agentNumber: string;
  @Column()
  ringStart: Date;
  @Column({nullable:true, default: null})
  answerTime?: Date;
  @Column({nullable:true, default: null})
  hangupTime: Date;
  @Column({default: 0})
  satisfaction: number;
  @Column({type: 'enum', enum: AgentHangupCause, default: AgentHangupCause.system})
  hangupCase: string;
  @Column({default: -1})
  idleTime: number;
  @OneToOne(() => PbxAgent)
  @JoinColumn()
  agent: PbxAgent;
}
