import { Test, TestingModule } from '@nestjs/testing';
import { PrivateMessageService } from './private-message.service';

describe('PrivateMessageService', () => {
  let service: PrivateMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateMessageService],
    }).compile();

    service = module.get<PrivateMessageService>(PrivateMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
