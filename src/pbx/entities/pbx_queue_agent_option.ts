import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  OneToMany,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pbx_queue_agent_option')
export class PbxQueueAgentOption {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({default: 'callback'})
  type: string; // 'callback' will try to reach the agent via the contact fields value. 'uuid-standby' will try to bridge the call directly using the agent uuid.
  @Column({default: ''})
  contact: string; //A simple dial string can be put in here, like: user/1000@default. If using verto: ${verto_contact(1000@default)}
  @Column({default: 'Available'})
  status: string;
  @Column({default: 10})
  maxNoAnswer: number; //坐席未应答数超过该值，将自动置为On Break
  @Column({default: 15})
  wrapUpTime: number; // 每次应答后，强制坐席空闲多少时间
  @Column({default: 0})
  rejectDelayTime: number;
  @Column({default: 0})
  busyDelayTime: number;
  @Column({default: 0})
  noAnswerDelayTime: number;
  @Column({default: false})
  reserveAgents: boolean;
  @Column({default: false})
  truncateAgentsOnLoad: boolean;
  @Column({default: false})
  truncateTiersOnLoad: boolean;
  @Column({default: 30})
  maxRingTime: number;
}
