import {
  parseDirectory,
  parsePublicIdentity,
  parseStats,
  type NetworkDirectory,
  type NetworkPublicIdentity,
  type NetworkStats,
} from './network-contract.ts';

const RETRYABLE_GATEWAY_STATUSES = new Set([502, 504]);

export type TetiNetworkClientErrorKind =
  | 'aborted'
  | 'invalid-response'
  | 'network'
  | 'network-http'
  | 'timeout';

export class TetiNetworkClientError extends Error {
  public readonly kind: TetiNetworkClientErrorKind;
  public readonly status: number | null;
  public readonly networkCode: string | null;
  public readonly retryAfterSeconds: number | null;

  public constructor(
    kind: TetiNetworkClientErrorKind,
    options: {
      status?: number;
      networkCode?: string;
      retryAfterSeconds?: number;
      cause?: unknown;
    } = {},
  ) {
    super(`Teti Network request failed: ${kind}`, {cause: options.cause});
    this.name = 'TetiNetworkClientError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.networkCode = options.networkCode ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

export type TetiNetworkClientOptions = {
  origin: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
};

export class TetiNetworkClient {
  private readonly origin: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retryDelayMs: number;

  public constructor(options: TetiNetworkClientOptions) {
    const origin = new URL(options.origin);
    if (
      (origin.protocol !== 'https:' && origin.protocol !== 'http:') ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    ) {
      throw new Error('TETI_NETWORK_ORIGIN must be an HTTP(S) origin without credentials or a path');
    }
    this.origin = origin.toString().replace(/\/$/, '');
    this.fetchImpl = options.fetch
      ? (input, init) => options.fetch!(input, init)
      : (input, init) => globalThis.fetch(input, init);
    this.timeoutMs = options.timeoutMs ?? 3500;
    this.retryDelayMs = options.retryDelayMs ?? 100;
  }

  public listPublicIdentities(
    input: {limit?: string; cursor?: string} = {},
    signal?: AbortSignal,
  ): Promise<NetworkDirectory> {
    const query = new URLSearchParams();
    if (input.limit !== undefined) query.set('limit', input.limit);
    if (input.cursor !== undefined) query.set('cursor', input.cursor);
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    return this.request(`/v1/public/directory${suffix}`, parseDirectory, signal);
  }

  public getPublicIdentity(tetiId: string, signal?: AbortSignal): Promise<NetworkPublicIdentity> {
    return this.request(
      `/v1/public/identities/${encodeURIComponent(tetiId)}`,
      parsePublicIdentity,
      signal,
    );
  }

  public getPublicStats(signal?: AbortSignal): Promise<NetworkStats> {
    return this.request('/v1/public/stats', parseStats, signal);
  }

  private async request<T>(
    path: string,
    parse: (value: unknown) => T,
    signal?: AbortSignal,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.requestOnce(path, parse, signal);
      } catch (error) {
        lastError = error;
        if (signal?.aborted || !this.shouldRetry(error) || attempt === 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
      }
    }
    throw lastError;
  }

  private async requestOnce<T>(
    path: string,
    parse: (value: unknown) => T,
    signal?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController();
    let didTimeout = false;
    const timeout = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, this.timeoutMs);
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener('abort', abortFromCaller, {once: true});

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.origin}${path}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Teti-Client-Platform': 'web',
          'Teti-Client-Version': '1.0.0-beta.1',
          'Teti-Protocol-Version': '1',
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw new TetiNetworkClientError('aborted', {cause: error});
      }
      if (didTimeout) {
        throw new TetiNetworkClientError('timeout', {cause: error});
      }
      throw new TetiNetworkClientError('network', {cause: error});
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromCaller);
    }

    const protocolVersion = response.headers.get('Teti-Protocol-Version');
    const contractRevision = Number(response.headers.get('Teti-Contract-Revision'));
    if (response.ok && (protocolVersion !== '1' || !Number.isInteger(contractRevision) || contractRevision < 9)) {
      throw new TetiNetworkClientError('invalid-response');
    }

    const body = await readJson(response);
    if (!response.ok) {
      const networkError = readNetworkError(body);
      const retryAfter = Number(response.headers.get('Retry-After'));
      throw new TetiNetworkClientError('network-http', {
        status: response.status,
        networkCode: networkError?.code,
        retryAfterSeconds:
          Number.isSafeInteger(retryAfter) && retryAfter >= 0 ? retryAfter : undefined,
      });
    }

    try {
      return parse(body);
    } catch (error) {
      throw new TetiNetworkClientError('invalid-response', {cause: error});
    }
  }

  private shouldRetry(error: unknown): boolean {
    return (
      error instanceof TetiNetworkClientError &&
      (error.kind === 'network' ||
        error.kind === 'timeout' ||
        (error.status !== null && RETRYABLE_GATEWAY_STATUSES.has(error.status)))
    );
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new TetiNetworkClientError('invalid-response', {cause: error});
  }
}

function readNetworkError(value: unknown): {code: string} | null {
  if (typeof value !== 'object' || value === null || !('error' in value)) return null;
  const error = value.error;
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return typeof error.code === 'string' ? {code: error.code} : null;
}
