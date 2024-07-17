import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_local_number')
@Index(["tenantId", "number"], { unique: true })
export class PbxLocalNumber extends BaseEntity {
    @Column()
    tenantId:number;
    @Column()
    number:string;
    @Column()
    localType:string;
    @Column()
    assign:string;
}

