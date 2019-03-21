import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthorizationGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    getRequest(context: ExecutionContext): any {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }

    async canActivate(context: ExecutionContext): Promise<boolean>  {

        let request = context.switchToHttp().getRequest();
        if (!request) {
            request = this.getRequest(context);
        }
        request.user = await this.getAuthentication(context);
        if (!request.user) {
            throw new UnauthorizedException('not_authorized');
        }

        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles || !roles.length) {
            return true;
        }
        // Logger.log(`roles: ${roles}`, 'AuthorizationGuard');

        const auth = request.user;
        Logger.log(`Auth: ${JSON.stringify(auth)}`, 'GQLAuthorizationGuard');
        const hasRole = () => auth.roles.some((role: string) => roles.includes(role));
        return auth && auth.roles && hasRole();
    }

    private async getAuthentication(context: ExecutionContext): Promise<any> {
        let request = context.switchToHttp().getRequest();
        if (!request) {
            request = this.getRequest(context);
        }
        if (!request.headers.authorization) {
            return false;
        }
        return await this.validateToken(request.headers.authorization);
    }

    private async validateToken(auth: string): Promise<any> {
        const elements = auth.split(' ');
        if (elements[0] !== 'Bearer') {
            return false;
        }
        try {
            const token = elements[1];
            const secret = process.env.SECRET || '';
            return await jwt.verify(token, secret);
        } catch (ex) {
            return false;
        }
    }
}
