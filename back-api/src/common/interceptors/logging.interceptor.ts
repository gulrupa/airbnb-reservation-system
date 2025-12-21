import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    this.logger.debug(`${method} ${url} - Request`, {
      body,
      query,
      params,
    });

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const delay = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${statusCode} - ${delay}ms`,
        );
      }),
      catchError((error) => {
        const delay = Date.now() - now;
        this.logger.error(
          `${method} ${url} - Error after ${delay}ms`,
          error.stack || error.message,
        );
        return throwError(() => error);
      }),
    );
  }
}

