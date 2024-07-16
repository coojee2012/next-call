import { Injectable } from '@nestjs/common';
import { CreatePbxDto } from '../dto/create-pbx.dto';
import { UpdatePbxDto } from '../dto/update-pbx.dto';

@Injectable()
export class PbxService {
  create(createPbxDto: CreatePbxDto) {
    return 'This action adds a new pbx';
  }

  findAll() {
    return `This action returns all pbx`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pbx`;
  }

  update(id: number, updatePbxDto: UpdatePbxDto) {
    return `This action updates a #${id} pbx`;
  }

  remove(id: number) {
    return `This action removes a #${id} pbx`;
  }
}
