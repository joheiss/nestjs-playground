import { createParamDecorator } from '@nestjs/common';

export const Auth = createParamDecorator((data: any, request: any) => {
    return data ? request.user[data] : request.user;
});
