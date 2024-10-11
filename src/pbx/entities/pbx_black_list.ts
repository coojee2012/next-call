import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_blacklist')
@Index(["tenantId", "phoneNumber"], { unique: true })
export class PbxBlackList extends BaseEntity {
    @Column()
    tenantId:number;
    @Column()
    phoneNumber:string;
    @Column()
    createBy:string;
    @Column()
    modifyBy:string;
    @Column()
    memo:string;
}
