import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { PbxQueueOption } from './pbx_queue_option';
import { PbxQueueAgentOption } from './pbx_queue_agent_option';

@Entity('pbx_queue')
@Index(["tenantId", "queueNumber"], { unique: true })
export class PbxQueue extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  queueNumber: string;
  @Column()
  queueName: string;
  @Column({default: ''})
  description: string;
  @Column({default: ''})
  announceFile: string; // 将在电话接通的时候播放xxxx,
  @Column({default: false})
  playRing: string; //等待用户听到振铃声，0听背景音乐
  @Column({default: false})
  sayMember: boolean; //是否启用播放坐席工号
  @Column({default: ''})
  failedDone: string; //队列呼叫失败的本地处理号码
  @Column('simple-array')
  members: string[]; //队列成员，如:[8001,8002,8003]
  /**                  
   ;ringall :ring 所有可用channels 直到应答为止
   ;roundrobin :轮流ring 每个可用interface,1calls :1-<2-<3,2calls:2-<3-<1;3calls:3-<1-<2
   ;leastrecent :ring 进来最少在队列中最少被呼叫的interface,有可能一直响某台分机
   ;fewestcalls :ring one 最少completed calls
   ;random  :随机ring
   ;rrmemory :在内存中把最后一个ring pass 放到最左边,即不会一直ring某个分机
   ;linear    :根据配置文件中的顺序ring（v1.6）
   ;wrandom   :(V1.6)
   **/
  @Column({default: 0})
  announceFrequency: number; //每隔多少秒将向队列等待者播放提示录音
  @OneToOne(() => PbxQueueOption)
  @JoinColumn()
  queue: PbxQueueOption;
  @OneToOne(() => PbxQueueAgentOption)
  @JoinColumn()
  agent: PbxQueueAgentOption; // 'callback' will try to reach the agent via the contact fields value. 'uuid-standby' will try to bridge the call directly using the agent uuid.
  @Column()
  hasNew: boolean;
}
