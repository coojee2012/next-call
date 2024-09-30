import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleEntity } from 'src/role/entities/role.entity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEventEntity } from './user_event.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { GroupMessage } from 'src/group-message/entities/group-message.entity';
import { PrivateMessage } from 'src/private-message/entities/private-message.entity';
import { GroupMember } from 'src/group-member/entities/group-member.entity';

@Entity('user')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
  username: string;
  @Column()
  firstName: string;
  @Column()
  lastName: string;
  @Column()
  nickName: string;
  @Column()
  headImage: string;
  @Column()
  headImageThumb: string;
  @Column()
  sex: number;
  @Column()
  signature: string;
  @Column()
  isBanned: boolean;
  @Column()
  bannedReason: boolean;
  @Column()
  type: number;
  @Column()
  @Exclude()
  password: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  tenant: Tenant;

  @OneToMany(
    () => RoleToUserEntity,
    (roleToUserEntity) => roleToUserEntity.role,
  )
  userRoles: RoleToUserEntity[];

  @OneToMany(() => UserEventEntity, (userEventEntity) => userEventEntity.user)
  userEvents: UserEventEntity[];

  @OneToMany(() => GroupMessage, (groupMessage) => groupMessage.user)
  groupMessages: GroupMessage[];

  @OneToMany(() => PrivateMessage, (privateMessage) => privateMessage.send)
  priSendMessages: PrivateMessage[];

  @OneToMany(() => PrivateMessage, (privateMessage) => privateMessage.recv)
  priRecvMessages: PrivateMessage[];

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groups: GroupMember[];


  @Transform(({ value }) => value.name)
  role: RoleEntity;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }
}
