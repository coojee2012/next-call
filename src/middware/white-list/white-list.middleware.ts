import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response} from 'express';
@Injectable()
export class WhiteListMiddleware implements NestMiddleware {
  
  whiteList: string[] = ['/users']
  use(req: Request, res: Response, next: () => void) {
    console.log(req.originalUrl,'我收全局的')
    if(this.whiteList.includes(req.originalUrl)) {
      next()
    } else {
      res.status(401).send("mmmmm")
    }
  }
}
