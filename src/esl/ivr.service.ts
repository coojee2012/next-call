import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { FreeSwitchPbxService } from './free-switch-pbx.service';
import { RuntimeDataService } from './runtime-data.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IvrService {
  private mainIvrNumber: string; // 主菜单IVR号码，通常表示为第一次该IVR的号码
  private preIvrNumber: string; // 上一层IVR菜单的号码
  constructor(
    private logger: LoggerService,
    private fsPbx: FreeSwitchPbxService,
    private runtimeData: RuntimeDataService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {}
}
