import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
@Entity('friend')
export class Friend extends BaseEntity  {

    /**
     * 用户id
     */
    @Column()
    userId: number;

    /**
     * 好友id
     */
    @Column()
    friendId: number;

    /**
     * 用户昵称
     */
    @Column({default:''}  )
    nickName:string;

    /**
     * 用户头像
     */
    @Column({default:''})
    headImage:string;
    @Column({default: false})
    online: boolean;
    @Column({default: false})
    onlineApp: boolean;
    @Column({default: false})
    onlineWeb: boolean;
}
