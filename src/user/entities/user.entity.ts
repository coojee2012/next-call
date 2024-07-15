import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleEntity } from 'src/role/entities/role.entity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

@Entity("user")
export class UserEntity extends BaseEntity {
  @Column({unique: true})
  username: string;
  @Column()
  firstName: string;
  @Column()
  lastName: string;
  @Column()
  @Exclude()
  password: string;
  @OneToMany(() => RoleToUserEntity, roleToUserEntity => roleToUserEntity.role)
  public userRoles: RoleToUserEntity[];

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
