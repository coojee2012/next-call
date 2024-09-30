import { PartialType } from '@nestjs/mapped-types';
import { CreateSensitiveWordDto } from './create-sensitive-word.dto';

export class UpdateSensitiveWordDto extends PartialType(CreateSensitiveWordDto) {}
