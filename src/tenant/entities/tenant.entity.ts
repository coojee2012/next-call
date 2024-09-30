import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEntity } from 'src/user/entities/user.entity';
@Entity('tenant')
export class Tenant extends BaseEntity {
    @Column()
    domain: string;
    @Column()
    companyName: string;  // 租户公司名称
    @Column()
    companyAddr: string;  // 租户公司名称
    @Column()
    location: string; // 区域
    @Column({default:0})
    balance: number; // 账户余额
    @Column({default:0})
    consume: number;  // 消费总额
    apikey: string;
    @Column('simple-array')
    dids: string[];  // 呼叫中心电话号码
    @Column('simple-array')
    telephones: string[]; // 公司联系电话

    @OneToMany(() => UserEntity, (user) => user.tenant)
    users: UserEntity[]
}
