import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Note: front-end and backend must be keep same
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*'); //'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*'); //'Content-Type, Accept, Authorization, X-Requested-With, Origin, X-Custom-Header');

    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
