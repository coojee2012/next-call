import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';


@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), TypeOrmModule.forFeature([RoleToUserEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports:[UserService]
})
export class UserModule {}
