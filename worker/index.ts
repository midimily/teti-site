export interface Env {
  TETI_REGISTRY?: KVNamespace;
  TETI_REG?: KVNamespace;
  TETI?: KVNamespace;
  ADMIN_TOKEN?: string;
}

type TetiStatus = 'online' | 'thinking' | 'idle' | 'offline';

export type TetiRecord = {
  id: string;
  name: string;
  handle: string;
  summary: string;
  status: TetiStatus;
  location: string;
  capabilities: string[];
  signal: string;
  lastSeen: string;
};

type RegistryTetiDocument = {
  version?: number;
  id?: string;
  address?: string;
  displayName?: string;
  publicKey?: string;
  publicProfile?: {
    name?: string;
    platform?: string;
    category?: string[];
    aiEnvironment?: string[];
    description?: string;
    capabilities?: string[];
    lastSeen?: string;
    [key: string]: unknown;
  };
  updatedAt?: string;
  createdAt?: string;
  lastSeenAt?: string;
  lastSeen?: string;
};

type RegistryIndex = {
  version: 1;
  generatedAt: string;
  page: number;
  pageSize: number;
  registryCount: number | null;
  tetis: TetiRecord[];
};

type RegistryStats = {
  version: 1;
  generatedAt: string;
  registryCount: number | null;
  activeCount: number;
  recentCount: number | null;
};

type ActiveBucketEntry = {
  id: string;
  lastSeenAt: string;
  document: RegistryTetiDocument;
};

type ActiveBucket = {
  version: 1;
  bucket: string;
  updatedAt: string;
  entries: ActiveBucketEntry[];
};

type ActiveSnapshot = {
  version: 1;
  generatedAt: string;
  registryCount: number | null;
  activeCount: number;
  tetis: TetiRecord[];
};

const ACTIVE_KEY = 'registry:active';
const RECENT_KEY = 'registry:recent';
const STATS_KEY = 'registry:stats';
const INDEX_META_KEY = 'registry:index:meta';
const INDEX_PAGE_SIZE = 100;
const ACTIVE_WINDOW_MS = 10 * 60 * 1000;
const HEARTBEAT_WRITE_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVE_BUCKET_COUNT = 32;
const MAX_INDEX_PAGE_TETIS = 100;
const MAX_ACTIVE_SNAPSHOT_TETIS = 1000;
const REGISTRY_TTL_SECONDS = 7 * 24 * 60 * 60;

const seedTetis: TetiRecord[] = [
  {id: 'mochi', name: 'Mochi', handle: '@mochi', summary: 'Curious companion for small rituals, messages, and daily context.', status: 'online', location: 'Recently active', capabilities: ['mail', 'coding', 'web'], signal: 'Ready for a local connection', lastSeen: 'recently active'},
  {id: 'kiko', name: 'Kiko', handle: '@kiko', summary: 'Adventure seeker that helps explore places, photos, and maps.', status: 'thinking', location: 'Network node', capabilities: ['explore', 'photo', 'map'], signal: 'Preparing a connection window', lastSeen: 'recently active'},
  {id: 'panda', name: 'Panda', handle: '@panda', summary: 'Gentle and calm companion for memory, diary, and reflection.', status: 'idle', location: 'Quiet mode', capabilities: ['memory', 'diary'], signal: 'Available when awakened from desktop', lastSeen: '12m ago'},
  {id: 'neko', name: 'Neko', handle: '@neko', summary: 'Coding companion for debugging, learning, and steady focus.', status: 'online', location: 'Developer workspace', capabilities: ['code', 'debug', 'learn'], signal: 'Accepting connection requests', lastSeen: 'recently active'},
];

const noStoreHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate',
  pragma: 'no-cache',
  expires: '0',
  'access-control-allow-origin': '*',
};

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {...noStoreHeaders, ...init?.headers},
  });
}

function publicResponse(body: unknown, cacheControl: string) {
  return response(body, {headers: {'cache-control': cacheControl}});
}

function toTitle(value: string) {
  return value.replace(/^teti[_-]?/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, match => match.toUpperCase());
}

function validDate(value: string | undefined) {
  return value && Number.isFinite(Date.parse(value)) ? value : undefined;
}

function getRegistry(env: Env) {
  return env.TETI_REGISTRY ?? env.TETI_REG ?? env.TETI;
}

function activityTime(document: RegistryTetiDocument) {
  return validDate(document.lastSeenAt) ?? validDate(document.lastSeen) ?? validDate(document.publicProfile?.lastSeen) ?? validDate(document.updatedAt) ?? validDate(document.createdAt);
}

function getLastSeen(timestamp?: string) {
  if (!timestamp) return 'registered';
  const ageMs = Math.max(0, Date.now() - Date.parse(timestamp));
  if (ageMs < 2 * 60 * 1000) return 'recently active';
  if (ageMs < 60 * 60 * 1000) return `${Math.max(1, Math.floor(ageMs / (60 * 1000)))}m ago`;
  if (ageMs < 24 * 60 * 60 * 1000) return `${Math.floor(ageMs / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(ageMs / (24 * 60 * 60 * 1000))}d ago`;
}

function getStatus(timestamp?: string): TetiStatus {
  if (!timestamp) return 'idle';
  const ageMs = Math.max(0, Date.now() - Date.parse(timestamp));
  if (ageMs < ACTIVE_WINDOW_MS) return 'online';
  if (ageMs < 24 * 60 * 60 * 1000) return 'thinking';
  return 'idle';
}

function normalizeRegistryDocument(raw: RegistryTetiDocument): TetiRecord | null {
  if (!raw.id && !raw.address) return null;
  const id = raw.id ?? raw.address ?? 'unknown';
  const addressName = raw.address?.split('@')[0];
  const profile = raw.publicProfile ?? {};
  const capabilities = [...(Array.isArray(profile.category) ? profile.category : []), ...(Array.isArray(profile.aiEnvironment) ? profile.aiEnvironment : []), ...(Array.isArray(profile.capabilities) ? profile.capabilities : [])].filter(Boolean).slice(0, 4);
  const timestamp = activityTime(raw);
  const status = getStatus(timestamp);
  return {
    id,
    name: profile.name ?? raw.displayName ?? `Teti ${toTitle(addressName ?? id)}`,
    handle: `@${addressName ?? id.replace(/^teti[_-]?/, '')}`,
    summary: profile.description ?? `${profile.platform ?? 'Teti network'} companion identity registered on the open Teti network.`,
    status,
    location: profile.platform ?? 'Teti network',
    capabilities: capabilities.length ? capabilities : ['companion'],
    signal: status === 'online' ? 'Active in the last few minutes' : 'Available through Teti Desktop',
    lastSeen: getLastSeen(timestamp),
  };
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

async function getJson<T>(registry: KVNamespace | undefined, key: string) {
  return parseJson<T>(registry ? await registry.get(key) : null);
}

function indexKey(page: number) { return `registry:index:page:${page}`; }

function bucketKey(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  return `registry:active:bucket:${((hash >>> 0) % ACTIVE_BUCKET_COUNT).toString(16).padStart(2, '0')}`;
}

function bucketIdFromKey(key: string) { return key.slice(-2); }

function isActive(timestamp: string, now = Date.now()) { return now - Date.parse(timestamp) < ACTIVE_WINDOW_MS; }

function sortRecords(records: TetiRecord[]) {
  return records.sort((left, right) => {
    const status = Number(right.status === 'online') - Number(left.status === 'online');
    return status || left.name.localeCompare(right.name);
  });
}

function seedStats(): RegistryStats {
  return {version: 1, generatedAt: 'seed', registryCount: seedTetis.length, activeCount: seedTetis.filter(teti => teti.status === 'online').length, recentCount: seedTetis.length};
}

function aggregateMeta(source: 'active' | 'index' | 'seed', kvBound: boolean, registryCount: number | null, requestedIndexKey: string, cacheHint: string) {
  return {source, kvBound, listUsed: false, indexKey: requestedIndexKey, registryCount, cacheHint};
}

async function getPublicTetis(env: Env, page: number | null) {
  const registry = getRegistry(env);
  const key = page === null ? ACTIVE_KEY : indexKey(page);
  const [aggregate, stats] = await Promise.all([
    getJson<ActiveSnapshot | RegistryIndex>(registry, key),
    getJson<RegistryStats>(registry, STATS_KEY),
  ]);
  const records = aggregate && Array.isArray(aggregate.tetis)
    ? aggregate.tetis.slice(0, page === null ? MAX_ACTIVE_SNAPSHOT_TETIS : MAX_INDEX_PAGE_TETIS)
    : null;
  const source = records ? (page === null ? 'active' : 'index') : 'seed';
  const registryCount = stats
    ? stats.registryCount
    : aggregate
      ? aggregate.registryCount
      : registry
        ? null
        : seedTetis.length;
  return {
    tetis: records ?? seedTetis,
    meta: aggregateMeta(source, Boolean(registry), registryCount, key, page === null ? 'public, max-age=30, s-maxage=60' : 'public, max-age=30, s-maxage=60'),
  };
}

async function getPublicStats(env: Env) {
  const registry = getRegistry(env);
  if (!registry) {
    const stats = seedStats();
    return {...stats, meta: {source: 'seed', kvBound: false, listUsed: false, cacheHint: 'public, max-age=60, s-maxage=120'}};
  }
  const [stats, active] = await Promise.all([getJson<RegistryStats>(registry, STATS_KEY), getJson<ActiveSnapshot>(registry, ACTIVE_KEY)]);
  const resolved: RegistryStats = stats ?? {version: 1, generatedAt: 'uninitialized', registryCount: null, activeCount: active?.activeCount ?? 0, recentCount: null};
  return {...resolved, meta: {source: stats ? 'registry:stats' : 'uninitialized', kvBound: true, listUsed: false, cacheHint: 'public, max-age=60, s-maxage=120'}};
}

function createConnectIntent(teti: TetiRecord) {
  return {tetiId: teti.id, desktopUrl: `teti://connect/${encodeURIComponent(teti.id)}`, fallbackDownloadUrl: '/downloads/teti-desktop-mac.dmg', expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()};
}

function validTetiId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch { return null; }
}

function documentFromInput(body: Record<string, unknown>, existing: RegistryTetiDocument | null): RegistryTetiDocument | null {
  const nested = body.teti && typeof body.teti === 'object' && !Array.isArray(body.teti) ? body.teti as Record<string, unknown> : body;
  const candidateId = nested.id ?? body.teti_id ?? body.tetiId ?? body.id;
  if (!validTetiId(candidateId)) return null;
  const now = new Date().toISOString();
  const profile = nested.publicProfile && typeof nested.publicProfile === 'object' && !Array.isArray(nested.publicProfile) ? nested.publicProfile as RegistryTetiDocument['publicProfile'] : existing?.publicProfile;
  const suppliedLastSeen = validDate(profile?.lastSeen) ?? now;
  return {...existing, ...nested as RegistryTetiDocument, id: candidateId, publicProfile: profile, version: 1, createdAt: existing?.createdAt ?? now, updatedAt: now, lastSeenAt: suppliedLastSeen, lastSeen: suppliedLastSeen};
}

async function putBucket(registry: KVNamespace, document: RegistryTetiDocument) {
  const id = document.id;
  const lastSeenAt = activityTime(document);
  if (!id || !lastSeenAt) return;
  const key = bucketKey(id);
  const existing = await getJson<ActiveBucket>(registry, key);
  const now = Date.now();
  const entries = (existing?.entries ?? []).filter(entry => entry.id !== id && validDate(entry.lastSeenAt) && isActive(entry.lastSeenAt, now));
  entries.push({id, lastSeenAt, document});
  await registry.put(key, JSON.stringify({version: 1, bucket: bucketIdFromKey(key), updatedAt: new Date(now).toISOString(), entries} satisfies ActiveBucket));
}

async function updateRecentAndPageOne(registry: KVNamespace, document: RegistryTetiDocument, registryCount: number | null) {
  const record = normalizeRegistryDocument(document);
  if (!record) return;
  const [recent, pageOne] = await Promise.all([getJson<RegistryIndex>(registry, RECENT_KEY), getJson<RegistryIndex>(registry, indexKey(1))]);
  const update = (old: RegistryIndex | null, page: number) => ({version: 1 as const, generatedAt: new Date().toISOString(), page, pageSize: INDEX_PAGE_SIZE, registryCount, tetis: [record, ...(old?.tetis ?? []).filter(item => item.id !== record.id)].slice(0, INDEX_PAGE_SIZE)} satisfies RegistryIndex);
  await Promise.all([registry.put(RECENT_KEY, JSON.stringify(update(recent, 1))), registry.put(indexKey(1), JSON.stringify(update(pageOne, 1)))]);
}

function legacyError(status: number, error: string, message: string) {
  return response({success: false, error, message}, {status});
}

async function registerTeti(request: Request, env: Env, legacy = false) {
  const registry = getRegistry(env);
  if (!registry) return legacy ? legacyError(500, 'KV_BINDING_MISSING', 'TETI KV binding is missing.') : response({error: 'TETI_REGISTRY KV binding is unavailable'}, {status: 503});
  const body = await readBody(request);
  if (!body) return legacy ? legacyError(400, 'INVALID_REQUEST', 'Expected a JSON object.') : response({error: 'Expected a JSON object'}, {status: 400});
  const requestedId = body.teti_id ?? body.tetiId ?? body.id ?? (body.teti as Record<string, unknown> | undefined)?.id;
  if (!validTetiId(requestedId)) return legacy ? legacyError(400, 'INVALID_REQUEST', 'A valid Teti id is required.') : response({error: 'A valid teti_id is required'}, {status: 400});
  const existing = await getJson<RegistryTetiDocument>(registry, `teti:${requestedId}`);
  if (legacy && existing && (existing.address !== body.address || existing.publicKey !== body.publicKey)) {
    return legacyError(409, 'IDENTITY_EXISTS', 'Identity already exists with different public identity data.');
  }
  const document = documentFromInput(body, existing);
  if (!document) return legacy ? legacyError(400, 'INVALID_REQUEST', 'A valid Teti id is required.') : response({error: 'A valid teti_id is required'}, {status: 400});
  const previousStats = await getJson<RegistryStats>(registry, STATS_KEY);
  const previousCount = typeof previousStats?.registryCount === 'number' ? Math.max(previousStats.registryCount, 0) : null;
  const registryCount = previousCount !== null ? previousCount + (existing ? 0 : 1) : existing ? null : 1;
  const stats: RegistryStats | null = registryCount === null ? null : {version: 1, generatedAt: new Date().toISOString(), registryCount, activeCount: previousStats?.activeCount ?? 0, recentCount: Math.min(registryCount, INDEX_PAGE_SIZE)};
  await registry.put(`teti:${document.id}`, JSON.stringify(document), {expirationTtl: REGISTRY_TTL_SECONDS});
  await Promise.all([putBucket(registry, document), updateRecentAndPageOne(registry, document, registryCount), ...(stats ? [registry.put(STATS_KEY, JSON.stringify(stats))] : [])]);
  if (legacy) return response({success: true, data: document}, {status: existing ? 200 : 201});
  return response({ok: true, created: !existing, teti: normalizeRegistryDocument(document), listUsed: false});
}

async function heartbeat(request: Request, env: Env, legacy = false) {
  const registry = getRegistry(env);
  if (!registry) return legacy ? legacyError(500, 'KV_BINDING_MISSING', 'TETI KV binding is missing.') : response({error: 'TETI_REGISTRY KV binding is unavailable'}, {status: 503});
  const body = await readBody(request);
  const id = body?.teti_id ?? body?.tetiId ?? body?.id;
  if (!validTetiId(id)) return legacy ? legacyError(400, 'INVALID_REQUEST', 'A valid Teti id is required.') : response({error: 'A valid teti_id is required'}, {status: 400});
  const existing = await getJson<RegistryTetiDocument>(registry, `teti:${id}`);
  if (!existing) return legacy ? legacyError(404, 'IDENTITY_NOT_FOUND', 'Identity not found.') : response({error: 'Teti not found'}, {status: 404});
  const lastSeenAt = activityTime(existing);
  if (lastSeenAt && Date.now() - Date.parse(lastSeenAt) < HEARTBEAT_WRITE_INTERVAL_MS) {
    if (legacy) return response({success: true, data: existing, skippedWrite: true});
    return response({ok: true, skippedWrite: true, teti_id: id, nextWriteAfter: new Date(Date.parse(lastSeenAt) + HEARTBEAT_WRITE_INTERVAL_MS).toISOString(), listUsed: false});
  }
  const now = new Date().toISOString();
  const suppliedProfile = body?.publicProfile && typeof body.publicProfile === 'object' && !Array.isArray(body.publicProfile) ? body.publicProfile as RegistryTetiDocument['publicProfile'] : existing.publicProfile;
  const effectiveLastSeen = validDate(suppliedProfile?.lastSeen) ?? now;
  const updated = {...existing, id, publicProfile: suppliedProfile, lastSeenAt: effectiveLastSeen, lastSeen: effectiveLastSeen, updatedAt: now};
  await registry.put(`teti:${id}`, JSON.stringify(updated), {expirationTtl: REGISTRY_TTL_SECONDS});
  await putBucket(registry, updated);
  if (legacy) return response({success: true, data: updated, skippedWrite: false});
  return response({ok: true, skippedWrite: false, teti_id: id, listUsed: false});
}

function hasAdminAccess(request: Request, env: Env) {
  const token = request.headers.get('x-admin-token') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return Boolean(env.ADMIN_TOKEN && token && token === env.ADMIN_TOKEN);
}

async function rebuildActiveSnapshot(registry: KVNamespace, registryCount?: number | null) {
  const bucketKeys = Array.from({length: ACTIVE_BUCKET_COUNT}, (_, index) => `registry:active:bucket:${index.toString(16).padStart(2, '0')}`);
  const buckets = await Promise.all(bucketKeys.map(key => getJson<ActiveBucket>(registry, key)));
  const now = Date.now();
  const documents = new Map<string, RegistryTetiDocument>();
  for (const bucket of buckets) for (const entry of bucket?.entries ?? []) if (validDate(entry.lastSeenAt) && isActive(entry.lastSeenAt, now)) documents.set(entry.id, {...entry.document, lastSeenAt: entry.lastSeenAt});
  const tetis = sortRecords([...documents.values()].map(normalizeRegistryDocument).filter((record): record is TetiRecord => Boolean(record))).slice(0, MAX_ACTIVE_SNAPSHOT_TETIS);
  const stats = await getJson<RegistryStats>(registry, STATS_KEY);
  const snapshot: ActiveSnapshot = {version: 1, generatedAt: new Date(now).toISOString(), registryCount: registryCount !== undefined ? registryCount : stats?.registryCount ?? null, activeCount: documents.size, tetis};
  await registry.put(ACTIVE_KEY, JSON.stringify(snapshot));
  if (stats) await registry.put(STATS_KEY, JSON.stringify({...stats, generatedAt: snapshot.generatedAt, activeCount: snapshot.activeCount}));
  return snapshot;
}

async function rebuildIndex(registry: KVNamespace) {
  // This is deliberately the only KV.list call in the Worker. It is reachable only via the admin route below.
  const documents: RegistryTetiDocument[] = [];
  let cursor: string | undefined;
  do {
    const listed = await registry.list({prefix: 'teti:', cursor});
    const keys = listed.keys.filter(key => key.name !== 'teti:list');
    for (let start = 0; start < keys.length; start += 50) {
      const values = await Promise.all(keys.slice(start, start + 50).map(key => registry.get(key.name)));
      for (const value of values) {
        const document = parseJson<RegistryTetiDocument>(value);
        if (document?.id) documents.push(document);
      }
    }
    if (listed.list_complete) {
      cursor = undefined;
    } else {
      cursor = (listed as {cursor: string}).cursor;
    }
  } while (cursor);
  const records = sortRecords(documents.map(normalizeRegistryDocument).filter((record): record is TetiRecord => Boolean(record)));
  const generatedAt = new Date().toISOString();
  const pages = Math.max(1, Math.ceil(records.length / INDEX_PAGE_SIZE));
  const activeDocuments = documents.filter(document => {
    const timestamp = activityTime(document);
    return Boolean(timestamp && isActive(timestamp));
  });
  const bucketEntries = new Map<string, ActiveBucketEntry[]>();
  for (const document of activeDocuments) {
    const id = document.id;
    const lastSeenAt = activityTime(document);
    if (!id || !lastSeenAt) continue;
    const key = bucketKey(id);
    const entries = bucketEntries.get(key) ?? [];
    entries.push({id, lastSeenAt, document});
    bucketEntries.set(key, entries);
  }
  const bucketKeys = Array.from({length: ACTIVE_BUCKET_COUNT}, (_, index) => `registry:active:bucket:${index.toString(16).padStart(2, '0')}`);
  await Promise.all(Array.from({length: pages}, (_, offset) => {
    const page = offset + 1;
    const index: RegistryIndex = {version: 1, generatedAt, page, pageSize: INDEX_PAGE_SIZE, registryCount: records.length, tetis: records.slice(offset * INDEX_PAGE_SIZE, page * INDEX_PAGE_SIZE)};
    return registry.put(indexKey(page), JSON.stringify(index));
  }));
  const activeTetis = sortRecords(activeDocuments.map(normalizeRegistryDocument).filter((record): record is TetiRecord => Boolean(record))).slice(0, MAX_ACTIVE_SNAPSHOT_TETIS);
  const active: ActiveSnapshot = {version: 1, generatedAt, registryCount: records.length, activeCount: activeDocuments.length, tetis: activeTetis};
  const stats: RegistryStats = {version: 1, generatedAt, registryCount: records.length, activeCount: active.activeCount, recentCount: Math.min(records.length, INDEX_PAGE_SIZE)};
  await Promise.all([
    registry.put(RECENT_KEY, JSON.stringify({version: 1, generatedAt, page: 1, pageSize: INDEX_PAGE_SIZE, registryCount: records.length, tetis: records.slice(0, INDEX_PAGE_SIZE)} satisfies RegistryIndex)),
    registry.put(STATS_KEY, JSON.stringify(stats)),
    registry.put(ACTIVE_KEY, JSON.stringify(active)),
    registry.put(INDEX_META_KEY, JSON.stringify({version: 1, generatedAt, pageSize: INDEX_PAGE_SIZE, registryCount: records.length, pages})),
    ...bucketKeys.map(key => registry.put(key, JSON.stringify({version: 1, bucket: bucketIdFromKey(key), updatedAt: generatedAt, entries: bucketEntries.get(key) ?? []} satisfies ActiveBucket))),
  ]);
  return {registryCount: records.length, pages, activeCount: active.activeCount};
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, {headers: {'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization, x-admin-token'}});

    if (pathname === '/register' && request.method === 'POST') return registerTeti(request, env, true);
    if (pathname === '/heartbeat' && request.method === 'POST') return heartbeat(request, env, true);
    if (pathname === '/discover' && request.method === 'GET') {
      const registry = getRegistry(env);
      const publicRegistry = await getPublicTetis(env, null);
      const items = (await Promise.all(publicRegistry.tetis.slice(0, 50).map(teti => getJson<RegistryTetiDocument>(registry, `teti:${teti.id}`)))).filter((item): item is RegistryTetiDocument => Boolean(item));
      return publicResponse({success: true, data: {items, count: items.length}}, 'public, max-age=30, s-maxage=60');
    }
    const legacyProfileMatch = pathname.match(/^\/profile\/([^/]+)$/);
    if (legacyProfileMatch && request.method === 'GET') {
      const id = decodeURIComponent(legacyProfileMatch[1]);
      const document = validTetiId(id) ? await getJson<RegistryTetiDocument>(getRegistry(env), `teti:${id}`) : null;
      return document ? publicResponse({success: true, data: document}, 'public, max-age=30, s-maxage=60') : legacyError(404, 'IDENTITY_NOT_FOUND', 'Identity not found.');
    }

    if (pathname === '/api/tetis' && request.method === 'GET') {
      const rawPage = url.searchParams.get('page');
      const page = rawPage === null ? null : Number(rawPage);
      if (page !== null && (!Number.isInteger(page) || page < 1)) return response({error: 'page must be a positive integer'}, {status: 400});
      return publicResponse(await getPublicTetis(env, page), 'public, max-age=30, s-maxage=60');
    }
    if (pathname === '/api/stats' && request.method === 'GET') return publicResponse(await getPublicStats(env), 'public, max-age=60, s-maxage=120');
    if (pathname === '/api/health' && request.method === 'GET') return response({ok: true, kvBound: Boolean(getRegistry(env)), listUsed: false});
    if (pathname === '/api/register' && request.method === 'POST') return registerTeti(request, env);
    if (pathname === '/api/heartbeat' && request.method === 'POST') return heartbeat(request, env);
    if (pathname === '/api/admin/rebuild-index' && request.method === 'POST') {
      if (!hasAdminAccess(request, env)) return response({error: 'Unauthorized'}, {status: 401});
      const registry = getRegistry(env);
      if (!registry) return response({error: 'TETI_REGISTRY KV binding is unavailable'}, {status: 503});
      try {
        return response({ok: true, rebuilt: await rebuildIndex(registry), listUsed: true});
      } catch {
        return response({ok: false, error: 'KV_LIST_FAILED', message: 'Registry rebuild could not scan KV. Check the KV list quota and retry after it resets.', listUsed: true}, {status: 503});
      }
    }

    const tetiMatch = pathname.match(/^\/api\/tetis\/([^/]+)$/);
    if (tetiMatch && request.method === 'GET') {
      const id = decodeURIComponent(tetiMatch[1]);
      const document = validTetiId(id) ? await getJson<RegistryTetiDocument>(getRegistry(env), `teti:${id}`) : null;
      const teti = document ? normalizeRegistryDocument(document) : seedTetis.find(item => item.id === id);
      return teti ? publicResponse({teti, meta: {kvBound: Boolean(getRegistry(env)), listUsed: false}}, 'public, max-age=30, s-maxage=60') : response({error: 'Teti not found'}, {status: 404});
    }
    const connectMatch = pathname.match(/^\/api\/tetis\/([^/]+)\/connect$/);
    if (connectMatch && request.method === 'POST') {
      const id = decodeURIComponent(connectMatch[1]);
      const document = validTetiId(id) ? await getJson<RegistryTetiDocument>(getRegistry(env), `teti:${id}`) : null;
      const teti = document ? normalizeRegistryDocument(document) : seedTetis.find(item => item.id === id);
      if (!teti) return response({error: 'Teti not found'}, {status: 404});
      if (teti.status === 'offline') return response({error: 'Teti requires desktop sync before connecting'}, {status: 409});
      return response({connect: createConnectIntent(teti)});
    }
    if (pathname === '/api/desktop' && request.method === 'GET') return response({desktop: {latestVersion: '0.1.0', platforms: {macos: '/downloads/teti-desktop-mac.dmg', windows: '/downloads/teti-desktop-windows.exe', linux: '/downloads/teti-desktop-linux.AppImage'}}});
    return response({error: 'Not found'}, {status: 404});
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const registry = getRegistry(env);
    if (registry) ctx.waitUntil(rebuildActiveSnapshot(registry));
  },
};
