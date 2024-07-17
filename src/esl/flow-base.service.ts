import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { IvrService } from './ivr.service';
import { PbxLocalNumberService } from 'src/pbx/services/pbx_local_number.service';
import { PbxCallProcessService } from '../pbx/services/pbx_call_process.service';
import { PbxCdrService } from 'src/pbx/services/pbx_cdr.service';
import { PbxIvrMenmuService } from 'src/pbx/services/pbx_ivr_menmu.service';
import { PbxRecordFileService } from 'src/pbx/services/pbx_record_file.service';
import { PbxExtensionnService } from 'src/pbx/services/pbx_extensionn.service';
import { TenantService } from 'src/tenant/tenant.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { RuntimeDataService } from './runtime-data.service';

@Injectable()
export class FlowBaseService {
  constructor(
    private readonly logger: LoggerService,
    private ivr: IvrService,
    private pbxLocalNumberService: PbxLocalNumberService,
    private pbxCallProcessService: PbxCallProcessService,
    private pbxCdrService: PbxCdrService,
    private pbxIvrMenuService: PbxIvrMenmuService,
    private pbxRecordFileService: PbxRecordFileService,
    private pbxExtensionService: PbxExtensionnService,
    private tenantService: TenantService,
    private fsPbx: FreeSwitchPbxService,
    private runtimeData: RuntimeDataService,
  ) {}
}
