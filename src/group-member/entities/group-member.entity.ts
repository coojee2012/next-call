import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { Group } from 'src/group/entities/group.entity';
import { UserEntity } from 'src/user/entities/user.entity';


@Entity('group-member')
export class GroupMember extends BaseEntity {
    @ManyToOne(() => Group, group => group.members)
    group: Group;

    @ManyToOne(() => UserEntity, user => user.groups)
    user: UserEntity;

    @Column({default: ''})
    userNickName: string;
    @Column({default: ''})
    remarkNickName: string;
    @Column({default: ''})
    headImage: string;
    @Column({default: ''})
    remarkGroupName: string;
    @Column({default: false})
    quit: boolean;
    @Column({nullable: true} )
    quitTime: Date;
    
}
