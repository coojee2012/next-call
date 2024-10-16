import { Brackets, DeepPartial, FindOptionsWhere, Like, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseEntity } from './entiies/BaseEntity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async listSearch(searchKey:string, searchFields:string[], data: Partial<T>): Promise<T[]> {
    const where: string | Brackets | ObjectLiteral | ObjectLiteral[] | ((qb: SelectQueryBuilder<T>) => string) = [];
    if(searchKey) {
      searchFields.forEach(field => {
        where.push({ [field]: Like(`%${searchKey}%`) });
      });
    }
    const docs = await this.repository.createQueryBuilder()
    .where(where)
    .andWhere(data)
    .getMany();
    return docs;
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
    const entity = await this.repository.save(data as DeepPartial<T>);
    return entity;
  }

  async bulkCreate(entityLikeArray: DeepPartial<T>[]): Promise<T[]> {
    const entities = await this.repository.save(entityLikeArray as DeepPartial<T>[]);
    return entities;
  }

  async update(id: number, data: Partial<T>): Promise<T|null> {
    await this.repository.update(id, data as QueryDeepPartialEntity<T>);
    return await this.findById(id);
  }

  async updateOne(where: Partial<T>, data: Partial<T>): Promise<T|null> {
    await this.repository.update(where as FindOptionsWhere<T>, data as QueryDeepPartialEntity<T>);
    return await this.findOne(where);
  }

  async updateBy(where: Partial<T>, data: Partial<T>): Promise<number | undefined> {
    const result = await this.repository.update(where as FindOptionsWhere<T>, data as QueryDeepPartialEntity<T>);
    return result?.affected;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
  async deleteOne(where: Partial<T>): Promise<void> {
    await this.repository.delete(where as FindOptionsWhere<T>);
  }
  async deleteBy(where: Partial<T>): Promise<number> {
    const result = await this.repository.delete(where as FindOptionsWhere<T>);
    if(!result || !result.affected) {
      return 0;
    }
    return result.affected;
  }
}

