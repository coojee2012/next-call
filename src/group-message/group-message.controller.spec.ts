import { Test, TestingModule } from '@nestjs/testing';
import { GroupMessageController } from './group-message.controller';
import { GroupMessageService } from './group-message.service';

describe('GroupMessageController', () => {
  let controller: GroupMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupMessageController],
      providers: [GroupMessageService],
    }).compile();

    controller = module.get<GroupMessageController>(GroupMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
