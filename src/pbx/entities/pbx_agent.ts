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
  @Column({default: ''})
  callId: string;
  @Column({default:0})
  position: number;
  @Column({default:0})
  lastBridgeEnd: number;
  @Column({default:0})
  lastBridgeStart: number;
  @Column({default:0})
  warpUpTime: number;
  @Column({default:0})
  lastOfferedCall: number;
  @Column({default:0})
  answeredCalls: number;
  @Column({default:0})
  noAnsweredCalls: number;
  @Column({default:0})
  busyDelayTime: number;
  @Column({default:0})
  noAnswerDelayTime: number;
  @Column({default:0})
  maxNoAnswer: number;
  @Column({default:0})
  rejectDelayTime: number;
  @Column({default:0})
  talkTime: number;
}
