import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_ivr_input')
export class PbxIvrInput extends BaseEntity {
    @Column()
    tenantId:number;
    @Column()
    ivrNumber:string;
    @Column()
    actionId:string;
    @Column({default:0})
    general:number; // 0,普通按键；1，默认响应
    @Column()
    generalType:string; // 错误响应：包括无效按键或等待按键超时标识或重试次数设置【timeout,invalidKey,retry】
    @Column()
    generalArgs: string; // 错误响应参数
    @Column()
    inputNumber:string;
    @Column()
    gotoIvrActId: number;
    @Column()
    gotoIvrNumber:string;
}
