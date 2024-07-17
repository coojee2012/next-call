import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { BaseEntity } from './entiies/BaseEntity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseService<T extends BaseEntity> {
  constructor(private readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<T|null> {
    return await this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  async findOne(data: Partial<T>): Promise<T | null> {
    return await this.repository.findOneBy(data as FindOptionsWhere<T>);
  }

  async findBy(data: Partial<T>): Promise<T[]> {
    return await this.repository.findBy(data as FindOptionsWhere<T>);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = await this.repository.create(data as DeepPartial<T>);
    return await this.repository.create(entity);
  }

  async update(id: number, data: Partial<T>): Promise<T|null> {
    await this.repository.update(id, data as QueryDeepPartialEntity<T>);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}

