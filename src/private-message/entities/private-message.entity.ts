import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEntity } from 'src/user/entities/user.entity';

@Entity('private-message')
export class PrivateMessage extends BaseEntity {
    @Column({type: 'text', nullable: false})
    content: string;

    @ManyToOne(() => UserEntity, (user) => user.priSendMessages)
    send: UserEntity;
    @Column()
    sendId: number;

    @ManyToOne(() => UserEntity, (user) => user.priRecvMessages)
    recv: UserEntity;
    @Column()
    recvId: number;

    @Column()
    type: number;
    @Column()
    status: number;
    @Column({type: 'bigint'})
    sendTime: number;
}
