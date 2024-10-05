import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Transactional = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        return true; // 返回true表示需要开启事务
    },
);