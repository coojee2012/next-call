import { Test, TestingModule } from '@nestjs/testing';
import { PrivateMessageController } from './private-message.controller';
import { PrivateMessageService } from './private-message.service';

describe('PrivateMessageController', () => {
  let controller: PrivateMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivateMessageController],
      providers: [PrivateMessageService],
    }).compile();

    controller = module.get<PrivateMessageController>(PrivateMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
