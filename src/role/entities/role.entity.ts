import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';


@Entity("role")
export class RoleEntity extends BaseEntity {
  @Column()
  name: string;
  @OneToMany(() => RoleToUserEntity, roleToUserEntity => roleToUserEntity.user)
  public userRoles: RoleToUserEntity[];
  constructor(partial: Partial<RoleEntity>) {
    super();
    Object.assign(this, partial);
  }
}
