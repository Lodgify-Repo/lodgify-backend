import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((response) => {
        // If the service response layer already explicitly constructed an enterprise layout envelope, pass it through
        if (response && response.hasOwnProperty('data')) {
          return response;
        }
        // Force wrap everything else inside a parent object envelope to prevent raw arrays at root
        return { data: response };
      }),
    );
  }
}
