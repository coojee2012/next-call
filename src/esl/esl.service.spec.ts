import { Test, TestingModule } from '@nestjs/testing';
import { EslService } from './esl.service';

describe('EslService', () => {
  let service: EslService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EslService],
    }).compile();

    service = module.get<EslService>(EslService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
