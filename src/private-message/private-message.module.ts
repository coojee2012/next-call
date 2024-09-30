import { Module } from '@nestjs/common';
import { PrivateMessageService } from './private-message.service';
import { PrivateMessageController } from './private-message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivateMessage } from './entities/private-message.entity';
@Module({
  imports: [TypeOrmModule.forFeature([PrivateMessage])],
  controllers: [PrivateMessageController],
  providers: [PrivateMessageService],
  exports: [PrivateMessageService],
})
export class PrivateMessageModule {}
