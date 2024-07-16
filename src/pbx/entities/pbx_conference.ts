import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
@Entity('pbx_conference')
@Index(["tenantId", "number"], { unique: true })
export class PbxConference {
  @Column()
  tenantId: number;
  @Column()
  number: string;
  @Column()
  pinCode: string; //进入会议室的密码
  @Column({ default: 0 })
  playWhenEvent: number; //播放音乐当离开时
  @Column({ default: 0 })
  mohWhenOnlyOne: number; //只有一个人是播放等待音乐
}
