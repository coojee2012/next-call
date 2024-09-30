import { Test, TestingModule } from '@nestjs/testing';
import { SensitiveWordService } from './sensitive-word.service';

describe('SensitiveWordService', () => {
  let service: SensitiveWordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SensitiveWordService],
    }).compile();

    service = module.get<SensitiveWordService>(SensitiveWordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
