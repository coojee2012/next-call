import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response} from 'express';
@Injectable()
export class WhiteListMiddleware implements NestMiddleware {
  
  whiteList: string[] = ['/user/login']
  use(req: Request, res: Response, next: () => void) {
    if(this.whiteList.includes(req.originalUrl)) {
      next()
    } else {
      // TODO need to check the auth
      next()
    }
  }
}
