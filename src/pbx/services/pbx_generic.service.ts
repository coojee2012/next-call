import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';

@Injectable()
export class PbxGenericService<T extends ObjectLiteral> {
  private repository: Repository<T>;

  constructor(connection: DataSource, repo: EntityTarget<T>) {
    this.repository = connection.getRepository<T>(repo);
  }

  public async list(): Promise<T[]> {
    return await this.repository.find();
  }
}
