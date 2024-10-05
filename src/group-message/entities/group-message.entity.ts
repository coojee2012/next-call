import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEntity } from 'src/user/entities/user.entity';
import { Group } from 'src/group/entities/group.entity';
@Entity('group-message')
export class GroupMessage extends BaseEntity {
    // 发送用户ID
    @ManyToOne(() => UserEntity, user => user.groupMessages)
    send: UserEntity;
    @Column()
    sendId: number; // 发送用户id
    
    @ManyToOne(() => Group, group => group.groupMessages)
    group: Group; // 群
    @Column()
    groupId: number; // 群id

    @Column({ type: 'varchar', length: 50, nullable: true,default: '' })
    sendNickName: string;
    @Column({type:'text',nullable:true})
    recvIds: string; // 接受用户id,为空表示全体发送
    @Column({type:'varchar',length:100,nullable:true,default:''})
    atUserIds: string; // @用户列表
    @Column()
    content: string;
    @Column({default:0})
    type: number; // 消息类型 MessageType 0:普通消息 1:系统消息 2:通知消息
    @Column({default:0})
    status: number; // 0:未读 1:已读 2:删除
    @Column({default:false})
    isTop: boolean; // 是否置顶
    @Column({default:false})
    receipt: boolean; // 是否回执消息
    @Column({default:false})
    receiptOk: boolean; // 回执消息是否完成
    @Column({type: 'bigint'})
    sendTime: number;
}
