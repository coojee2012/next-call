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

@Entity('pbx_sound')
export class PbxSound extends BaseEntity {
      @Column()
      tenantId: number;
      @Column()
      filename: string;//文件名 abc1
      @Column({default:'wav'})
      extName: string;//扩展名 wav
      @Column({default:''})
      folder: string;//文件夹
      @Column({default:''})
      description: string;//描述
      @Column({default:''})
      label: string;//标签
      @Column({default:''})
      url: string;//s3 url
      @Column({default:''})
      associate: string;//关联
      @Column({default:false})
      readOnly: boolean;//系统只读
}
