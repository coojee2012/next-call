import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_agent')
export class PbxAgent extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  queueNumber: string;
  @Column()
  agentNumber: string;
  @Column()
  callId: string;
  @Column()
  position: number;
  @Column()
  lastBridgeEnd: number;
  @Column()
  lastBridgeStart: number;
  @Column()
  warpUpTime: number;
  @Column()
  lastOfferedCall: number;
  @Column()
  answeredCalls: number;
  @Column()
  noAnsweredCalls: number;
  @Column()
  busyDelayTime: number;
  @Column()
  noAnswerDelayTime: number;
  @Column()
  maxNoAnswer: number;
  @Column()
  rejectDelayTime: number;
  @Column()
  talkTime: number;
}
