import { Module } from '@nestjs/common';
import { PbxService } from './services/pbx.service';
import { PbxController } from './controllers/pbx.controller';
import { PbxAgentController } from './pbx_agent/pbx_agent.controller';
import { PbxAgentService } from './services/pbx_agent.service';
import { PbxBlackListService } from './services/pbx_blacklist.service';
import { PbxCallProcessService } from './services/pbx_call_process.service';
import { PbxCdrService } from './services/pbx_cdr.service';
import { PbxConferenceService } from './services/pbx_conference.service';
import { PbxExtensionnService } from './services/pbx_extensionn.service';
import { PbxFsHostService } from './services/pbx_fs_host.service';
import { PbxIvrMenmuService } from './services/pbx_ivr_menmu.service';
import { PbxIvrActionsService } from './services/pbx_ivr_actions.service';
import { PbxIvrInputService } from './services/pbx_ivr_input.service';
import { PbxLastServiceService } from './services/pbx_last_service.service';
import { PbxLocalNumberService } from './services/pbx_local_number.service';
import { PbxQueueMemberService } from './services/pbx_queue_member.service';
import { PbxQueueService } from './services/pbx_queue.service';
import { PbxRecordFileService } from './services/pbx_record_file.service';
import { PbxRouterService } from './services/pbx_router.service';
import { PbxSoundService } from './services/pbx_sound.service';
import { PbxTrunkService } from './services/pbx_trunk.service';
import { PbxQueueStatisticService } from './services/pbx_queue_statistic.service';
import { PbxAgentStatisticService } from './services/pbx_agent_statistic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PbxCallProcess } from './entities/pbx_call_process';
import { PbxCdr } from './entities/pbx_cdr';
import { PbxAgent } from './entities/pbx_agent';
import { PbxAgentStatistic } from './entities/pbx_agent_statistic';
import { PbxRecordFile } from './entities/pbx_record_file';
import { PbxQueue } from './entities/pbx_queue';
import { PbxQueueStatistic } from './entities/pbx_queue_statistic';
import { PbxExtensionn } from './entities/pbx_extensionn';
import { PbxQueueOption } from './entities/pbx_queue_option';
import { PbxQueueAgentOption } from './entities/pbx_queue_agent_option';
import { PbxQueueMember } from './entities/pbx_queue_member';
import { PbxBlackList } from './entities/pbx_black_list';
import { PbxConference } from './entities/pbx_conference';
import { PbxFsHost } from './entities/pbx_fs_host';
import { PbxIvrActions } from './entities/pbx_ivr_actions';
import { PbxIvrInput } from './entities/pbx_ivr_input';
import { PbxIvrMenmu } from './entities/pbx_ivr_menmu';
import { PbxLastService } from './entities/pbx_last_service';
import { PbxLocalNumber } from './entities/pbx_local_number';
import { PbxRouter } from './entities/pbx_router';
import { PbxSound } from './entities/pbx_sound';
import { PbxTrunk } from './entities/pbx_trunk';

@Module({
  imports: [
    TypeOrmModule.forFeature([PbxAgent]),
    TypeOrmModule.forFeature([PbxAgentStatistic]),
    TypeOrmModule.forFeature([PbxBlackList]),
    TypeOrmModule.forFeature([PbxCallProcess]),
    TypeOrmModule.forFeature([PbxCdr]),
    TypeOrmModule.forFeature([PbxConference]),
    TypeOrmModule.forFeature([PbxExtensionn]),
    TypeOrmModule.forFeature([PbxFsHost]),
    TypeOrmModule.forFeature([PbxIvrActions]),
    TypeOrmModule.forFeature([PbxIvrInput]),
    TypeOrmModule.forFeature([PbxIvrMenmu]),
    TypeOrmModule.forFeature([PbxLastService]),
    TypeOrmModule.forFeature([PbxLocalNumber]),
    TypeOrmModule.forFeature([PbxRecordFile]),
    TypeOrmModule.forFeature([PbxQueue]),
    TypeOrmModule.forFeature([PbxQueueOption]),
    TypeOrmModule.forFeature([PbxQueueAgentOption]),
    TypeOrmModule.forFeature([PbxQueueMember]),
    TypeOrmModule.forFeature([PbxQueueStatistic]),
    TypeOrmModule.forFeature([PbxRouter]),
    TypeOrmModule.forFeature([PbxSound]),
    TypeOrmModule.forFeature([PbxTrunk]),
  ],
  controllers: [PbxController, PbxAgentController],
  providers: [
    PbxService,
    PbxAgentService,
    PbxBlackListService,
    PbxCallProcessService,
    PbxCdrService,
    PbxConferenceService,
    PbxExtensionnService,
    PbxFsHostService,
    PbxIvrMenmuService,
    PbxIvrActionsService,
    PbxIvrInputService,
    PbxLastServiceService,
    PbxLocalNumberService,
    PbxQueueMemberService,
    PbxQueueService,
    PbxRecordFileService,
    PbxRouterService,
    PbxSoundService,
    PbxTrunkService,
    PbxQueueStatisticService,
    PbxAgentStatisticService,
  ],
  exports: [
    PbxService,
    PbxAgentService,
    PbxBlackListService,
    PbxCallProcessService,
    PbxCdrService,
    PbxConferenceService,
    PbxExtensionnService,
    PbxFsHostService,
    PbxIvrMenmuService,
    PbxIvrActionsService,
    PbxIvrInputService,
    PbxLastServiceService,
    PbxLocalNumberService,
    PbxQueueMemberService,
    PbxQueueService,
    PbxRecordFileService,
    PbxRouterService,
    PbxSoundService,
    PbxTrunkService,
    PbxQueueStatisticService,
    PbxAgentStatisticService,
  ],
})
export class PbxModule {}
