import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../domain/error';
import { mapDomainError } from './error-mapper';

@Catch()
export class EnterpriseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Enterprise Fault';
    let detail = 'A severe unexpected database or execution cycle error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      title = exceptionResponse?.error || exception.name || title;
      detail = exceptionResponse?.message || exception.message || detail;
    } else if (exception instanceof DomainError) {
      status = mapDomainError(exception);
      title = exception.code;
      detail = exception.message || exception.code;
    } else {
      // Unhandled error (log it)
      title = exception?.name || title;
      detail = exception?.message || detail;
    }

    // Enforce full compliance with RFC 7807 (Problem Details for HTTP APIs)
    const errorDetails = {
      type: `https://lodgify.com/errors/${status}`,
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
      ...(exception instanceof DomainError && exception.meta ? { meta: exception.meta } : {}),
    };

    response.status(status).header('Content-Type', 'application/problem+json').json(errorDetails);
  }
}
