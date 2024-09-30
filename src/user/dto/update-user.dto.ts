import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Exclude } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @Exclude()
    id: number;
    @Exclude()
    fullName: string;
    @Exclude()
    createAt: Date;
    @Exclude()
    statusName: string;
}
