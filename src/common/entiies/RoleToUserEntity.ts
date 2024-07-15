import { RoleEntity } from "src/role/entities/role.entity"
import { UserEntity } from "src/user/entities/user.entity"
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { BaseEntity } from "./BaseEntity"



@Entity("role-user")
export class RoleToUserEntity extends BaseEntity {
    @Column()
    public userId: number

    @Column()
    public roleId: number

    @Column()
    public order: number

    @ManyToOne(() => RoleEntity, (role) => role.userRoles)
    public role: RoleEntity

    @ManyToOne(() => UserEntity, (user) => user.userRoles)
    public user: UserEntity
}