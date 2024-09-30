import { Module } from '@nestjs/common';
import { SensitiveWordService } from './sensitive-word.service';
import { SensitiveWordController } from './sensitive-word.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveWord } from './entities/sensitive-word.entity';
@Module({
  imports: [TypeOrmModule.forFeature([SensitiveWord])],
  controllers: [SensitiveWordController],
  providers: [SensitiveWordService],
  exports: [SensitiveWordService],
})
export class SensitiveWordModule {}
