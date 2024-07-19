import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';
import { UserEventService } from './user-event.service';
import { UserEventEntity } from './entities/user_event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([RoleToUserEntity]),
    TypeOrmModule.forFeature([UserEventEntity]),
  ],
  controllers: [UserController],
  providers: [UserService, UserEventService],
  exports: [UserService, UserEventService],
})
export class UserModule {}
