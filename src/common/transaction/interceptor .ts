import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(private manager: TypeOrmModule) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const isTransactional = context.getHandler().prototype.hasOwnMetadata('Transactional', true);

        if (isTransactional) {
            // 开启事务
            //const transactionalEntityManager = this.manager.get(context.getClass()).transactionalEntityManager;
            //await transactionalEntityManager.startTransaction();

            try {
                const result = await next.handle();
                // 提交事务
                //await transactionalEntityManager.commitTransaction();
                return result;
            } catch (err) {
                // 事务回滚
                //await transactionalEntityManager.rollbackTransaction();
                throw err;
            }
        } else {    
            return next.handle().pipe(
                catchError(err => {
                    // 事务回滚
                    return throwError(() => err);
                })
            );
        }   
    }
}