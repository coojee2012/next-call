import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository, UpdateResult } from 'typeorm';
import { RoleEntity } from 'src/role/entities/role.entity';
import { RoleToUserEntity } from 'src/common/entiies/RoleToUserEntity';
import { LoggerService } from 'src/logger/logger.service';
import { classToPlain } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleToUserEntity)
    private roleUserRepository: Repository<RoleToUserEntity>,
    private dataSource: DataSource,
    private readonly logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity | undefined> {
    // await this.usersRepository.save(user);
    // const { roleIds } = createUserDto;
    // const roleUser = new RoleToUserEntity();
    // roleUser.role = new RoleEntity({ id: roleIds[0] });
    // roleUser.user = user;
    // await this.roleUserRepository.save(roleUser);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { roleIds } = createUserDto;
      const user = new UserEntity(createUserDto);
      await queryRunner.manager.save(user);
      const roleUser = new RoleToUserEntity();
      roleUser.role = new RoleEntity({ id: roleIds[0] });
      roleUser.user = user;
      roleUser.order = 1;
      await queryRunner.manager.save(roleUser);
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      this.logger.error(null, "create user error.", error)
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      relations: {
        userRoles: true,
      },
    });
  }

  findWithIds(ids: number[]): Promise<UserEntity[]> {
    return this.usersRepository.find({
      select:{
        password: false,
      },
      where: {
        id: In(ids),
      },
    });
  }

  findOne(id: number): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findOneBy(data: Partial<UserEntity>): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy(data as FindOptionsWhere<UserEntity>);
  }
  
  findOneWithTenant(data: Partial<UserEntity>): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: data as FindOptionsWhere<UserEntity>,
      relations: ['tenant'], 
    });
  }

  findBy(data: Partial<UserEntity>): Promise<UserEntity[]> {
    return this.usersRepository.findBy(data as FindOptionsWhere<UserEntity>);
  }

  update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
