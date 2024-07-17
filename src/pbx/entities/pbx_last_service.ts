import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_last_service')
export class PbxLastService extends BaseEntity {
    @Column()
    tenantId: number;
    @Column()
    callerNumber: string;
    @Column()
    calleeNumber: string;
    @Column({default:0})
    validTime: number;
    @Column('simple-json')
    extData: {}; // 扩展参数，用于记录一些特殊业务需要的数据
}
