import { Injectable } from '@nestjs/common';
import { CreateSensitiveWordDto } from './dto/create-sensitive-word.dto';
import { UpdateSensitiveWordDto } from './dto/update-sensitive-word.dto';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SensitiveWord } from './entities/sensitive-word.entity';
@Injectable()
export class SensitiveWordService extends BaseService<SensitiveWord> {
  constructor(
    @InjectRepository(SensitiveWord)
    private readonly sensitiveWordRepository: Repository<SensitiveWord>,
  ) {
    super(sensitiveWordRepository);
  }
 
}
