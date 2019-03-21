import { createParamDecorator } from '@nestjs/common';

export const GqlAuth = createParamDecorator((data: any, [root, args, ctx, info]) => {
    return data ? ctx.req.user[data] : ctx.req.user;
});
