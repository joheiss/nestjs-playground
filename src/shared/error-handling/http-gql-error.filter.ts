import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';

@Catch(HttpException)
export class HttpGqlErrorFilter implements GqlExceptionFilter {

    catch(exception: HttpException, host: ArgumentsHost): any {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        if (request) {
            const errorResponse = {
                code: typeof exception.getStatus === 'function' ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                message: exception.message.message || exception.message.error || exception.message || 'unknown_exception',
            };

            Logger.warn(`${errorResponse.method} ${errorResponse.path} ${errorResponse.code} ${errorResponse.message}`, 'HttpErrorFilter');
            response.status(errorResponse.code).json(errorResponse);
        } else {
            const gqlHost = GqlArgumentsHost.create(host);
            const errorResponse = {
                code: typeof exception.getStatus === 'function' ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: new Date().toISOString(),
                path: 'graphql',
                method: 'POST',
                message: exception.message.message || exception.message.error || exception.message || 'unknown_exception',
            };

            Logger.warn(`${errorResponse.method} ${errorResponse.path} ${errorResponse.code} ${errorResponse.message}`, 'HttpErrorFilter');
            return exception;
        }
    }
}
