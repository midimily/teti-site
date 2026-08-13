export type TetiPresence = 'available' | 'unavailable';

export type TetiIdentity = {
  id: string;
  displayName: string | null;
  summary: string | null;
  presence: TetiPresence;
};

export type NetworkSnapshot = {
  identities: TetiIdentity[];
  page: {
    limit: number;
    returnedCount: number;
    nextCursor: string | null;
  };
  stats: {
    totalTetis: number;
    publicTetis: number;
    availableNow: number;
    generatedAt: string;
  };
};

export class SiteApiError extends Error {
  public constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(`Teti site API failed: ${code}`);
    this.name = 'SiteApiError';
  }
}

export async function fetchNetworkSnapshot(
  input: {cursor?: string; signal?: AbortSignal} = {},
): Promise<NetworkSnapshot> {
  const query = new URLSearchParams({limit: '50'});
  if (input.cursor) query.set('cursor', input.cursor);
  return requestJson(`/api/network?${query.toString()}`, input.signal) as Promise<NetworkSnapshot>;
}

export async function fetchTetiIdentity(
  tetiId: string,
  signal?: AbortSignal,
): Promise<TetiIdentity> {
  const response = (await requestJson(
    `/api/network/identities/${encodeURIComponent(tetiId)}`,
    signal,
  )) as {identity: TetiIdentity};
  return response.identity;
}

async function requestJson(path: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      headers: {accept: 'application/json'},
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new SiteApiError('NETWORK_UNAVAILABLE', 503);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SiteApiError('NETWORK_RESPONSE_INVALID', 502);
  }
  if (!response.ok) {
    const code = readErrorCode(body) ?? 'NETWORK_UNAVAILABLE';
    throw new SiteApiError(code, response.status);
  }
  return body;
}

function readErrorCode(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('error' in value)) return null;
  const error = value.error;
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return typeof error.code === 'string' ? error.code : null;
}
