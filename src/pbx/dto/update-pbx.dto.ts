import { PartialType } from '@nestjs/mapped-types';
import { CreatePbxDto } from './create-pbx.dto';

export class UpdatePbxDto extends PartialType(CreatePbxDto) {}
