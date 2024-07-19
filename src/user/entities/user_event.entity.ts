import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from 'src/common/entiies/BaseEntity';
import { UserEntity } from './user.entity';

export enum UserEventType {
  login = 'login',
  logout = 'logout',
  checkin = 'checkin',
  checkout = 'checkout',
  busy= 'busy',
  idle = 'idle',
  waiting = 'waiting',
  rest = 'rest'
}

@Entity("user_event")
export class UserEventEntity extends BaseEntity {
  @Column()
  tenantId: number;
  @Column({
    type: 'enum',
    enum: UserEventType
  })
  eventType: UserEventType;
  @Column({
    type:'text'
  })
  memo: string;

  @ManyToOne(() => UserEntity, (user) => user.userEvents)
  user: UserEntity
  
 
  constructor(partial: Partial<UserEventEntity>) {
    super();
    Object.assign(this, partial);
  }
}
