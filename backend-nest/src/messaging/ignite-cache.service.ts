import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Ignite Cache Service com separação user-cache / admin-cache.
 * Tenta conectar via apache-ignite-client (thin client). Se indisponível ou Ignite off,
 * faz fallback para Map em memória (útil para dev/test sem Ignite).
 *
 * Caches:
 *  - user-cache  : dados de consumidores, produtos, pedidos B2C, sessão user
 *  - admin-cache : dashboard admin, métricas, pedidos B2B agregados, relatórios
 */

type CacheScope = 'user' | 'admin';

@Injectable()
export class IgniteCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IgniteCacheService.name);
  private igniteClient: any = null;
  private igniteConnected = false;

  // Fallback in-memory
  private memUserCache = new Map<string, { value: any; expiresAt: number }>();
  private memAdminCache = new Map<string, { value: any; expiresAt: number }>();

  // Ignite caches refs quando conectado
  private userCache: any = null;
  private adminCache: any = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('ignite.host', '127.0.0.1');
    const port = this.configService.get<number>('ignite.port', 10800);
    const userCacheName = this.configService.get<string>('ignite.userCache', 'user-cache');
    const adminCacheName = this.configService.get<string>('ignite.adminCache', 'admin-cache');

    try {
      // Lazy import para não quebrar se pacote ausente
      const IgniteClient = require('apache-ignite-client');
      const IgniteClientClass = IgniteClient.default || IgniteClient;

      // API varia por versão; tenta padrões comuns
      // Fallback: se IgniteClient não expõe connect esperado, usa modo mem
      if (typeof IgniteClientClass === 'function') {
        try {
          this.igniteClient = new IgniteClientClass();
          // onStateChanged para log
          if (this.igniteClient.on) {
            this.igniteClient.on('stateChanged', (state: any, reason: any) => {
              this.logger.log(`Ignite stateChanged ${state} reason=${reason}`);
            });
          }

          // Tenta conectar - API: client.connect(endpoint) onde endpoint = host:port
          const endpoint = `${host}:${port}`;
          if (typeof this.igniteClient.connect === 'function') {
            await this.igniteClient.connect(endpoint);
            this.igniteConnected = true;
          } else if (typeof this.igniteClient.connectAsync === 'function') {
            await this.igniteClient.connectAsync(endpoint);
            this.igniteConnected = true;
          }

          if (this.igniteConnected) {
            // getOrCreateCache
            if (typeof this.igniteClient.getOrCreateCache === 'function') {
              this.userCache = await this.igniteClient.getOrCreateCache(userCacheName);
              this.adminCache = await this.igniteClient.getOrCreateCache(adminCacheName);
            } else if (typeof this.igniteClient.getCache === 'function') {
              this.userCache = await this.igniteClient.getCache(userCacheName);
              this.adminCache = await this.igniteClient.getCache(adminCacheName);
            }
            this.logger.log(`Ignite conectado ${endpoint} | caches: ${userCacheName}, ${adminCacheName}`);
          }
        } catch (inner) {
          this.logger.warn(`Ignite connect falhou, usando fallback memória: ${inner.message}`);
          this.igniteConnected = false;
        }
      }
    } catch (e) {
      this.logger.warn(`apache-ignite-client não disponível ou erro: ${e.message} - fallback memória`);
    }

    if (!this.igniteConnected) {
      this.logger.log('IgniteCacheService em modo fallback MEMÓRIA (user-cache/admin-cache separados em Maps)');
      // Limpeza periódica de expirados
      setInterval(() => this.cleanupMem(), 60_000).unref();
    }
  }

  async onModuleDestroy() {
    try {
      if (this.igniteClient?.disconnect) {
        await this.igniteClient.disconnect();
      }
    } catch {}
  }

  private getMemCache(scope: CacheScope) {
    return scope === 'admin' ? this.memAdminCache : this.memUserCache;
  }

  private async igniteGet(cache: any, key: string): Promise<any> {
    if (!cache) return null;
    try {
      if (typeof cache.get === 'function') return await cache.get(key);
      if (typeof cache.getAsync === 'function') return await cache.getAsync(key);
    } catch (e) {
      this.logger.warn(`Ignite get falhou ${key}: ${e.message}`);
    }
    return null;
  }

  private async igniteSet(cache: any, key: string, value: any): Promise<void> {
    if (!cache) return;
    try {
      if (typeof cache.put === 'function') return await cache.put(key, value);
      if (typeof cache.putAsync === 'function') return await cache.putAsync(key, value);
    } catch (e) {
      this.logger.warn(`Ignite put falhou ${key}: ${e.message}`);
      throw e;
    }
  }

  private async igniteDel(cache: any, key: string): Promise<void> {
    if (!cache) return;
    try {
      if (typeof cache.remove === 'function') return await cache.remove(key);
      if (typeof cache.removeAsync === 'function') return await cache.removeAsync(key);
    } catch {}
  }

  async get(key: string, scope: CacheScope = 'user'): Promise<any | null> {
    if (this.igniteConnected) {
      const cache = scope === 'admin' ? this.adminCache : this.userCache;
      const val = await this.igniteGet(cache, key);
      return val ?? null;
    }
    const mem = this.getMemCache(scope);
    const entry = mem.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      mem.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds = 300, scope: CacheScope = 'user'): Promise<void> {
    if (this.igniteConnected) {
      const cache = scope === 'admin' ? this.adminCache : this.userCache;
      try {
        await this.igniteSet(cache, key, value);
        // TTL em Ignite exigiria expiryPolicy; simplificado: não expira no thin client sem config
        return;
      } catch {
        // fallback mem
      }
    }
    const mem = this.getMemCache(scope);
    mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string, scope: CacheScope = 'user'): Promise<void> {
    if (this.igniteConnected) {
      const cache = scope === 'admin' ? this.adminCache : this.userCache;
      await this.igniteDel(cache, key);
      return;
    }
    this.getMemCache(scope).delete(key);
  }

  async clear(scope: CacheScope = 'user'): Promise<void> {
    if (this.igniteConnected) {
      const cache = scope === 'admin' ? this.adminCache : this.userCache;
      try {
        if (typeof cache.clear === 'function') await cache.clear();
        if (typeof cache.clearAsync === 'function') await cache.clearAsync();
      } catch {}
      return;
    }
    this.getMemCache(scope).clear();
  }

  // Helpers tipados para separação explícita

  async getUserCache(key: string): Promise<any | null> {
    return this.get(key, 'user');
  }
  async setUserCache(key: string, value: any, ttl = 300): Promise<void> {
    return this.set(key, value, ttl, 'user');
  }
  async getAdminCache(key: string): Promise<any | null> {
    return this.get(key, 'admin');
  }
  async setAdminCache(key: string, value: any, ttl = 300): Promise<void> {
    return this.set(key, value, ttl, 'admin');
  }

  private cleanupMem() {
    const now = Date.now();
    for (const map of [this.memUserCache, this.memAdminCache]) {
      for (const [k, v] of map.entries()) {
        if (now > v.expiresAt) map.delete(k);
      }
    }
  }

  getStats() {
    return {
      igniteConnected: this.igniteConnected,
      userCacheSize: this.memUserCache.size,
      adminCacheSize: this.memAdminCache.size,
      mode: this.igniteConnected ? 'ignite' : 'memory-fallback',
    };
  }
}
