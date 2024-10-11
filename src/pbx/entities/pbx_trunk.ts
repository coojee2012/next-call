import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

export enum TrunkPtotocol {
  SIP = 'SIP',
  IAX2 = 'IAX2',
  PRI = 'PRI',
}

export enum TrunkTransport {
  TCP = 'tcp',
  UDP = 'udp',
}

@Entity('pbx_trunk')
@Index(['name', 'tenantId'], { unique: true })
export class PbxTrunk extends BaseEntity {
  @Column()
  tenantId: number;
  @Column({ unique: true })
  name: string; // 中继的名称
  @Column({
    type: 'enum',
    enum: TrunkPtotocol,
    default: TrunkPtotocol.SIP,
  })
  protocol: TrunkPtotocol; //协议 SIP,IAX2,等
  @Column({ default: '' })
  gateway: string; //SIP协议对应注册字符串或gateway:5060 或其他端口
  @Column({
    type: 'enum',
    enum: TrunkTransport,
    default: TrunkTransport.UDP,
  })
  transport: TrunkTransport;
  @Column({ default: '' })
  device: string; //针对硬件中继设置
  @Column('simple-array')
  dnds: string[]; //该中继拥有的号码
  @Column({ default: 0 })
  concurrentCall: number; // 中继的并发数,0表示不限制,-1表示禁用
  @Column({ default: '' })
  memo: string;
  @Column({ default: '' })
  args: string; //关于中继的一些其他参数
}
