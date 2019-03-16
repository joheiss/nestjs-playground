import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {

    catch(exception: HttpException, host: ArgumentsHost): any {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = {
            code: typeof exception.getStatus === 'function' ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: exception.message.message || exception.message.error || exception.message || 'unknown_exception',
        };

        Logger.warn(`${errorResponse.method} ${errorResponse.path} ${errorResponse.code} ${errorResponse.message}`, 'HttpErrorFilter');
        response.status(errorResponse.code).json(errorResponse);
    }
}
