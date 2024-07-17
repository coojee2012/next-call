import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/BaseService';
import { Repository } from 'typeorm';
import { PbxConference } from '../entities/pbx_conference';
@Injectable()
export class PbxConferenceService  extends BaseService<PbxConference> {
    constructor(@InjectRepository(PbxConference) repository: Repository<PbxConference>) {
      super(repository);
    }}
