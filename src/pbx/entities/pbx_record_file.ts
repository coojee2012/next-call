import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  OneToMany,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

export enum RecordType {
  QUEUE = 'queue',
  EXTENSION = 'exten',
  IVR = 'ivr',
  VOICE_MAIL = 'voicemail',
  OTHER = 'other',
}

@Entity('pbx_record_file')
export class PbxRecordFile extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  callId: string;
  @Column()
  filename: string; //文件名
  @Column({ default: '.wav' })
  extName: string; //扩展名
  @Column({ default: 0 })
  fileSize: number; //文件大小
  @Column()
  direction: string; //主叫方向
  @Column({
    type: 'enum',
    enum: RecordType,
    default: RecordType.OTHER,
  })
  label: RecordType; //录音类型，queue,exten,ivr,voicemail等
  @Column()
  extension: string; //关联分机号
  @Column()
  agentId: number; //关联坐席Id
  @Column()
  folder: string; //目录
  @Column({ default: '' })
  callNumber: string; //关联号码（主叫或被叫号码）
  @Column({ default: false })
  deleted: boolean; //已删除
}
