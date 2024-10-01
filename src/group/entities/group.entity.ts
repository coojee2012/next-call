import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { GroupMessage } from 'src/group-message/entities/group-message.entity';
import { GroupMember } from 'src/group-member/entities/group-member.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Entity('group')
export class Group extends BaseEntity {
  @Column({ unique: true })
  name: string;
  @ManyToOne(() => UserEntity, (user) => user.ownedGroups)
  owner: UserEntity
  @Column()
  ownerId: number;

  @Column({
    default: '',
    nullable: true,
  })
  headImage: string;

  @Column({
    default: '',
    nullable: true,
  })
  headImageThumb: string;

  @Column({
    default: '',
    nullable: true,
  })
  notice: string;

  @Column({
    default: '',
  })
  showNickName: string;
  @Column({
    default: '',
  })
  showGroupName: string;
  @Column({
    nullable: true,
    default: '',
  })
  remarkNickName: string;
  @Column({
    default: '',
  })
  remarkGroupName: string;

  @Column({
    default: false,
  })
  isBanned: boolean;

  @Column({
    default: '',
    nullable: true,
  })
  reason: string;

  @Column({ default: true })
  dissolve: boolean;

  @OneToMany(() => GroupMessage, (groupMessage) => groupMessage.sender)
  groupMessages: GroupMessage[];

  @OneToMany(() => GroupMember, (groupMessage) => groupMessage.group)
  members: GroupMessage[];
}
