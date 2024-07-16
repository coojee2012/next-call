import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_call_process')
export class PbxCallProcess extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  callId: string;
  @Column()
  caller: string;
  @Column()
  called: string;
  @Column()
  processName: string;
  @Column()
  passArgs: string;
  @Column()
  isHide: boolean;
}
