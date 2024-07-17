import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity('pbx_queue_member')
export class PbxQueueMember extends BaseEntity {
    @Column()
    tenantId:number;
    @Column()
    queueNumber:string;
    @Column({default: ''})
    fsName:string;
    @Column({default: ''})
    sessionUuid:string;
    @Column({default: ''})
    servingAgent:string;
    @Column({default: ''})
    callId:string;
    @Column({default: ''})
    cidName:string;
    @Column({default: ''})
    cidNumber:string;
    @Column({default: 0})
    callInAt:number;
    @Column({default: 0})
    joinAt:number;
    @Column({default: 0})
    reJoinAt:number;
    @Column({default: 0})
    bridgeAt:number;
    @Column({default: 0})
    abandonAt:number;
    @Column({default: 0})
    state:string;
}
