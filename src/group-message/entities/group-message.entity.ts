import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEntity } from 'src/user/entities/user.entity';
import { Group } from 'src/group/entities/group.entity';
@Entity('group-message')
export class GroupMessage extends BaseEntity {
    // 发送用户ID
    @ManyToOne(() => UserEntity, user => user.groupMessages)
    user: UserEntity;
    
    @ManyToOne(() => Group, group => group.groupMessages)
    sender: Group; // 群id

    @Column()
    sendNickName: string;
    @Column()
    recvIds: string; // 接受用户id,为空表示全体发送
    @Column()
    atUserIds: string; // @用户列表
    @Column()
    content: string;
    @Column()
    type: number; // 消息类型 MessageType 0:普通消息 1:系统消息 2:通知消息
    @Column()
    status: number; // 0:未读 1:已读 2:删除
    @Column()
    isTop: boolean; // 是否置顶
    @Column()
    receipt: boolean; // 是否回执消息
    @Column()
    receiptOk: boolean; // 回执消息是否完成
    
}
