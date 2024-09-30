import { Module } from '@nestjs/common';
import { GroupMessageService } from './group-message.service';
import { GroupMessageController } from './group-message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMessage } from './entities/group-message.entity';
@Module({
  imports: [TypeOrmModule.forFeature([GroupMessage])],
  controllers: [GroupMessageController],
  providers: [GroupMessageService],
  exports: [GroupMessageService],
})
export class GroupMessageModule {}
