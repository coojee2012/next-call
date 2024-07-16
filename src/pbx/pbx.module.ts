import { Module } from '@nestjs/common';
import { PbxService } from './services/pbx.service';
import { PbxController } from './controllers/pbx.controller';
import { PbxAgentController } from './pbx_agent/pbx_agent.controller';
import { PbxAgentService } from './services/pbx_agent.service';


@Module({
  controllers: [PbxController, PbxAgentController],
  providers: [PbxService, PbxAgentService],
})
export class PbxModule {}
