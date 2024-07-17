import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_ivr_menmu')
@Index(["tenantId", "ivrNumber"], { unique: true })
export class PbxIvrMenmu extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  ivrName: string;
  @Column()
  ivrNumber: string;
  @Column()
  description: string;
  @Column({ default: false })
  readOnly: boolean;
  @Column({ default: false })
  canTransfer:boolean;
}
