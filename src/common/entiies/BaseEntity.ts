import { Expose, Type } from 'class-transformer';
import {
  BaseEntity as TypeOrmBaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  @Type(() => Number)
  id: number;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({default: 0})
  status: number;

  // @Expose()
  // get statusName(): string {
  //   return this.status == 0 ? '正常' : '无效';
  // }
}
