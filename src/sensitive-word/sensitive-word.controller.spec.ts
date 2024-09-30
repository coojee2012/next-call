import { Test, TestingModule } from '@nestjs/testing';
import { SensitiveWordController } from './sensitive-word.controller';
import { SensitiveWordService } from './sensitive-word.service';

describe('SensitiveWordController', () => {
  let controller: SensitiveWordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensitiveWordController],
      providers: [SensitiveWordService],
    }).compile();

    controller = module.get<SensitiveWordController>(SensitiveWordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
