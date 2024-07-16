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
  @Column()
  answerTime?: Date;
  @Column({nullable:true})
  hangupTime: Date;
  @Column()
  satisfaction: number;
  @Column()
  hangupCase: string;
  @Column()
  idleTime: number;
  @OneToOne(() => PbxAgent)
  @JoinColumn()
  agent: PbxAgent;
}
