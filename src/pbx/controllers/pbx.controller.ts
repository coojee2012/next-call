import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PbxService } from '../services/pbx.service';
import { CreatePbxDto } from '../dto/create-pbx.dto';
import { UpdatePbxDto } from '../dto/update-pbx.dto';

@Controller('pbx')
export class PbxController {
  constructor(private readonly pbxService: PbxService) {}

  @Post()
  create(@Body() createPbxDto: CreatePbxDto) {
    return this.pbxService.create(createPbxDto);
  }

  @Get()
  findAll() {
    return this.pbxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pbxService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePbxDto: UpdatePbxDto) {
    return this.pbxService.update(+id, updatePbxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pbxService.remove(+id);
  }
}
