import {normalizeTetiId, toSiteIdentity, toSiteNetworkSnapshot} from './network-contract.ts';
import {TetiNetworkClient, TetiNetworkClientError} from './teti-network-client.ts';

export interface Env {
  TETI_NETWORK_ORIGIN?: string;
}

export interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

type SiteApiOptions = {
  cache?: EdgeCache;
  fetch?: typeof fetch;
  logger?: (entry: Record<string, unknown>) => void;
  waitUntil?: (promise: Promise<unknown>) => void;
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};
const DIRECTORY_CACHE = 'public, max-age=0, s-maxage=5, stale-while-revalidate=5';
const NO_STORE = 'no-store';

export function createSiteApi(options: SiteApiOptions = {}) {
  const logger = options.logger ?? (entry => console.info(JSON.stringify(entry)));

  return async function handle(request: Request, env: Env = {}): Promise<Response> {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const operation = operationFor(url.pathname);
    let status = 500;
    try {
      if (request.method !== 'GET') {
        status = 405;
        return siteError('METHOD_NOT_ALLOWED', status);
      }
      if (operation === null) {
        status = 404;
        return siteError('NOT_FOUND', status);
      }

      const exactTetiId =
        operation === 'network.identity'
          ? normalizeTetiId(decodeExactIdentityPath(url.pathname) ?? '')
          : null;
      if (operation === 'network.identity' && exactTetiId === null) {
        status = 400;
        return siteError('INVALID_TETI_ID', status);
      }
      const cacheRequest = canonicalCacheRequest(request, operation, exactTetiId);
      const cached = await options.cache?.match(cacheRequest).catch(error => {
        logger({event: 'site.cache.read_failed', operation, error: errorName(error)});
        return undefined;
      });
      if (cached) {
        status = cached.status;
        return cached;
      }

      const client = new TetiNetworkClient({
        origin: env.TETI_NETWORK_ORIGIN ?? 'https://network.teti.bot',
        ...(options.fetch ? {fetch: options.fetch} : {}),
      });
      let response: Response;

      if (operation === 'network.snapshot') {
        const query = parseDirectoryQuery(url.searchParams);
        const [directory, stats] = await Promise.all([
          client.listPublicIdentities(query, request.signal),
          client.getPublicStats(request.signal),
        ]);
        response = json(toSiteNetworkSnapshot(directory, stats), 200, DIRECTORY_CACHE);
      } else {
        const identity = await client.getPublicIdentity(exactTetiId!, request.signal);
        response = json({identity: toSiteIdentity(identity)}, 200, DIRECTORY_CACHE);
      }

      status = response.status;
      if (options.cache && options.waitUntil) {
        options.waitUntil(
          options.cache.put(cacheRequest, response.clone()).catch(error => {
            logger({event: 'site.cache.write_failed', operation, error: errorName(error)});
          }),
        );
      }
      return response;
    } catch (error) {
      logger({
        event: 'site.api.failed',
        operation: operation ?? 'unknown',
        ...errorContext(error),
      });
      const response = mapError(error, operation);
      status = response.status;
      return response;
    } finally {
      logger({
        event: 'site.api.request',
        operation: operation ?? 'unknown',
        status,
        durationMs: Date.now() - startedAt,
      });
    }
  };
}

function operationFor(pathname: string): 'network.identity' | 'network.snapshot' | null {
  if (pathname === '/api/network') return 'network.snapshot';
  return /^\/api\/network\/identities\/[^/]+$/.test(pathname) ? 'network.identity' : null;
}

function parseDirectoryQuery(searchParams: URLSearchParams): {limit?: string; cursor?: string} {
  const allowed = new Set(['limit', 'cursor']);
  for (const key of searchParams.keys()) {
    if (!allowed.has(key) || searchParams.getAll(key).length !== 1) {
      throw new SiteRequestError('INVALID_REQUEST');
    }
  }
  const result: {limit?: string; cursor?: string} = {};
  const limit = searchParams.get('limit');
  const cursor = searchParams.get('cursor');
  if (limit !== null) result.limit = limit;
  if (cursor !== null) result.cursor = cursor;
  return result;
}

function decodeExactIdentityPath(pathname: string): string | null {
  const value = pathname.slice('/api/network/identities/'.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

class SiteRequestError extends Error {
  public readonly code: string;
  public constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function mapError(
  error: unknown,
  operation: 'network.identity' | 'network.snapshot' | null,
): Response {
  if (error instanceof SiteRequestError) {
    return siteError(error.code, 400);
  }
  if (error instanceof TetiNetworkClientError) {
    if (
      operation === 'network.identity' &&
      (error.status === 404 || error.networkCode === 'IDENTITY_NOT_FOUND')
    ) {
      return siteError('TETI_NOT_FOUND', 404);
    }
    if (error.status === 400) {
      return siteError('INVALID_REQUEST', 400);
    }
    if (error.status === 429) {
      return siteError('RATE_LIMITED', 429, error.retryAfterSeconds);
    }
    if (error.kind === 'invalid-response') {
      return siteError('NETWORK_RESPONSE_INVALID', 502);
    }
    return siteError('NETWORK_UNAVAILABLE', 503);
  }
  return siteError('NETWORK_UNAVAILABLE', 503);
}

function canonicalCacheRequest(
  request: Request,
  operation: 'network.identity' | 'network.snapshot',
  exactTetiId: string | null,
): Request {
  if (operation === 'network.snapshot') return request;
  const url = new URL(request.url);
  url.pathname = `/api/network/identities/${exactTetiId}`;
  return new Request(url.toString(), {method: 'GET'});
}

function json(body: unknown, status: number, cacheControl: string, retryAfter?: number): Response {
  const headers = new Headers({...JSON_HEADERS, 'Cache-Control': cacheControl});
  if (retryAfter !== undefined) headers.set('Retry-After', String(retryAfter));
  return new Response(JSON.stringify(body), {status, headers});
}

function siteError(code: string, status: number, retryAfter?: number | null): Response {
  return json(
    {error: {code}},
    status,
    NO_STORE,
    retryAfter === null || retryAfter === undefined ? undefined : retryAfter,
  );
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function errorContext(error: unknown): Record<string, string | number> {
  if (error instanceof TetiNetworkClientError) {
    return {
      error: error.name,
      kind: error.kind,
      upstreamStatus: error.status ?? 0,
      upstreamCode: error.networkCode ?? 'none',
    };
  }
  if (error instanceof SiteRequestError) {
    return {error: error.name, kind: 'site-request', upstreamStatus: 0, upstreamCode: error.code};
  }
  return {error: errorName(error), kind: 'unknown', upstreamStatus: 0, upstreamCode: 'none'};
}
