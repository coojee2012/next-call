import { Expose } from 'class-transformer';
import {
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({default: 0})
  status: number;

  @Expose()
  get statusName(): string {
    return this.status == 0 ? '正常' : '无效';
  }
}
