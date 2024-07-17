import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_fs_host')
export class PbxFsHost extends BaseEntity {
  @Column()
  fsName: string;
  @Column({unique:true, nullable:false})
  fsCoreId: string;
  @Column()
  fsHost: string;
  @Column()
  runStatus: string;
}
