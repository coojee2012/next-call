import { Test, TestingModule } from '@nestjs/testing';
import { PbxAgentController } from './pbx_agent.controller';

describe('PbxAgentController', () => {
  let controller: PbxAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PbxAgentController],
    }).compile();

    controller = module.get<PbxAgentController>(PbxAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
