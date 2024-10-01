import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { Group } from 'src/group/entities/group.entity';
import { UserEntity } from 'src/user/entities/user.entity';


@Entity('group-member')
export class GroupMember extends BaseEntity {
    @ManyToOne(() => Group, group => group.members)
    group: Group;
    @Column()
    groupId: number;

    @ManyToOne(() => UserEntity, user => user.joinedGroups)
    user: UserEntity;
    @Column()
    userId: number;

    @Column({default: ''})
    userNickName: string; // 群成员昵称
    @Column({default: ''})
    remarkNickName: string; // 群成员备注名
    @Column({default: ''})
    headImage: string; // 群成员头像
    @Column({default: ''})
    remarkGroupName: string;    // 群备注名
    @Column({default: false})
    quit: boolean;
    @Column({nullable: true} )
    quitTime: Date;
    
}
