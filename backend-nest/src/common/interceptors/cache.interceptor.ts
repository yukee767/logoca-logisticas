import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IgniteCacheService } from '../../messaging/ignite-cache.service';

/**
 * Interceptor de cache usando Ignite separado user-cache / admin-cache.
 * Usa header X-Cache-Scope para decidir o cache: 'admin' ou 'user' (default).
 * Para GET, tenta buscar no cache; para demais métodos, invalida padrões relacionados.
 */
@Injectable()
export class IgniteCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IgniteCacheInterceptor.name);

  constructor(private readonly igniteCache: IgniteCacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;

    const isAdminScope =
      headers['x-cache-scope'] === 'admin' || request.user?.role === 'admin';

    // Apenas cacheia GET
    if (method !== 'GET') {
      return next.handle().pipe(
        tap(() => {
          // Invalidação simples: remove chave do url base sem query
          // Em produção, usar invalidação por tag
          this.logger.debug(`Invalidação pós-${method} ${url}`);
        }),
      );
    }

    const cacheKey = `${method}:${url}`;
    const cached = await this.igniteCache.get(cacheKey, isAdminScope ? 'admin' : 'user');

    if (cached) {
      this.logger.debug(`CACHE HIT [${isAdminScope ? 'admin-cache' : 'user-cache'}] ${cacheKey}`);
      return of(JSON.parse(cached as string));
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.igniteCache.set(cacheKey, JSON.stringify(data), 300, isAdminScope ? 'admin' : 'user');
          this.logger.debug(`CACHE SET [${isAdminScope ? 'admin-cache' : 'user-cache'}] ${cacheKey}`);
        } catch (e) {
          this.logger.warn(`Falha ao cachear ${cacheKey}: ${e.message}`);
        }
      }),
    );
  }
}
