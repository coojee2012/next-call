import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxSound } from '../entities/pbx_sound';
@Injectable()
export class PbxSoundService extends BaseService<PbxSound> {
    constructor(
      @InjectRepository(PbxSound) repository: Repository<PbxSound>,
    ) {
      super(repository);
    }
  }
