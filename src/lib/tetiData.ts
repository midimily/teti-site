export type TetiPresence = 'available' | 'unavailable';

export type TetiIdentity = {
  id: string;
  displayName: string | null;
  summary: string | null;
  presence: TetiPresence;
  capabilities: string[];
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

export type NetworkWindow = {
  snapshot: NetworkSnapshot;
  loadedPageCount: number;
};

export class SiteApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  public constructor(code: string, status: number) {
    super(`Teti site API failed: ${code}`);
    this.name = 'SiteApiError';
    this.code = code;
    this.status = status;
  }
}

export async function fetchNetworkSnapshot(
  input: {cursor?: string; signal?: AbortSignal} = {},
): Promise<NetworkSnapshot> {
  const query = new URLSearchParams({limit: '50'});
  if (input.cursor) query.set('cursor', input.cursor);
  const response = (await requestJson(
    `/api/network?${query.toString()}`,
    input.signal,
  )) as NetworkSnapshot;
  return {
    ...response,
    identities: response.identities.map(normalizeCapabilities),
  };
}

export async function fetchNetworkWindow(
  input: {
    pageCount?: number;
    signal?: AbortSignal;
    fetchPage?: typeof fetchNetworkSnapshot;
  } = {},
): Promise<NetworkWindow> {
  const requestedPageCount =
    Number.isInteger(input.pageCount) && (input.pageCount ?? 0) > 0 ? input.pageCount! : 1;
  const fetchPage = input.fetchPage ?? fetchNetworkSnapshot;
  let snapshot = await fetchPage({signal: input.signal});
  let loadedPageCount = 1;

  while (loadedPageCount < requestedPageCount && snapshot.page.nextCursor) {
    const next = await fetchPage({cursor: snapshot.page.nextCursor, signal: input.signal});
    snapshot = appendNetworkSnapshot(snapshot, next);
    loadedPageCount += 1;
  }

  return {snapshot, loadedPageCount};
}

export function appendNetworkSnapshot(
  current: NetworkSnapshot,
  next: NetworkSnapshot,
): NetworkSnapshot {
  const identities = [...current.identities, ...next.identities];
  for (let index = 1; index < identities.length; index += 1) {
    if (identities[index - 1].id >= identities[index].id) {
      throw new SiteApiError('NETWORK_RESPONSE_INVALID', 502);
    }
  }
  return {...next, identities};
}

export async function fetchTetiIdentity(
  tetiId: string,
  signal?: AbortSignal,
): Promise<TetiIdentity> {
  const response = (await requestJson(
    `/api/network/identities/${encodeURIComponent(tetiId)}`,
    signal,
  )) as {identity: TetiIdentity};
  return normalizeCapabilities(response.identity);
}

function normalizeCapabilities(identity: Omit<TetiIdentity, 'capabilities'> & {capabilities?: unknown}) {
  return {
    ...identity,
    capabilities: Array.isArray(identity.capabilities)
      ? identity.capabilities.filter(value => typeof value === 'string')
      : [],
  };
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
