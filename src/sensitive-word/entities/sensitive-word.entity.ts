import { Column, Entity, OneToMany,ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';
export class SensitiveWord extends BaseEntity {
    @Column()
    content: string;
    @Column()
    enabled: boolean;
}
