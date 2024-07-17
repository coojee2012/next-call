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

export enum RouterLineType {
  INBOUND = '呼入',
  OUTBOUNT = '呼出',
  LOCAL = '本地',
}

export enum ProcessMode {
DIAL_LOCAL = 'diallocal',
DIAL_OUT = 'dialout',
BLACKLIST = 'blacklist'
}

@Entity('pbx_router')
export class PbxRouter extends BaseEntity {
    @Column()
    tenantId:number;
    @Column()
    priority:number; //执行顺序（优先级）
    @Column({default: false})
    createMode:boolean; //系统默认
    @Column({type: 'enum', enum: RouterLineType})
    routerLine:RouterLineType;
    @Column()
    routerName:string; //路由方式，呼出，呼入,本地
    @Column()
    optExtra:string; //扩展属性
    @Column({default: false})
    lastWhenDone:boolean; //最终匹配规则
    @Column()
    callerGroup:string; //匹配主叫组（呼出对应分机分组，呼入对应中继分组）
    @Column()
    callerId:string; //匹配主叫以什么开头
    @Column({default: 0})
    callerLen:number; //匹配主叫长度
    @Column()
    calledNum:string; //匹配被叫以什么开头
    @Column({default:0})
    calledLen:number; //匹配被叫长度
    @Column()
    replaceCallerId:string; //匹配后主叫替换
    @Column({default: 0})
    replaceCalledTrim:number; //匹配后删除被叫前几位
    @Column()
    replaceCalledAppend:string; //匹配后补充被叫前几位
    @Column({type: 'enum', enum: ProcessMode})
    processMode:ProcessMode; //处理方式 【黑名单，本地处理，拨打外线】
    @Column('simple-json')
    processedFined:{}; //处理详细参数定义
}
