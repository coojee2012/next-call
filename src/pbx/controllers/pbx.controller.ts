import { Controller } from '@nestjs/common';
import { PbxService } from '../services/pbx.service';

@Controller('pbx')
export class PbxController {
  constructor(private readonly pbxService: PbxService) {}
}
