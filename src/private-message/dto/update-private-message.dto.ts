import { PartialType } from '@nestjs/mapped-types';
import { CreatePrivateMessageDto } from './create-private-message.dto';

export class UpdatePrivateMessageDto extends PartialType(CreatePrivateMessageDto) {}
