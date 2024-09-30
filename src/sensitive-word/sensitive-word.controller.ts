import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SensitiveWordService } from './sensitive-word.service';
import { CreateSensitiveWordDto } from './dto/create-sensitive-word.dto';
import { UpdateSensitiveWordDto } from './dto/update-sensitive-word.dto';

@Controller('sensitive-word')
export class SensitiveWordController {
  constructor(private readonly sensitiveWordService: SensitiveWordService) {}

  @Post()
  create(@Body() createSensitiveWordDto: CreateSensitiveWordDto) {
    return this.sensitiveWordService.create(createSensitiveWordDto);
  }

  @Get()
  findAll() {
    return this.sensitiveWordService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sensitiveWordService.findOne({ id: +id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSensitiveWordDto: UpdateSensitiveWordDto) {
    return this.sensitiveWordService.update(+id, updateSensitiveWordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sensitiveWordService.delete(+id);
  }
}
