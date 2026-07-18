import worker from '../.registry-beta-build/index.js';

class MemoryKV {
  values = new Map();
  puts = [];
  listCalls = 0;

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async put(key, value) {
    this.puts.push(key);
    this.values.set(key, value);
  }

  async list({prefix = '', cursor} = {}) {
    this.listCalls += 1;
    const keys = [...this.values.keys()]
      .filter(key => key.startsWith(prefix))
      .sort();
    const start = cursor ? Number(cursor) : 0;
    const slice = keys.slice(start, start + 1000);
    const next = start + slice.length;
    return {
      keys: slice.map(name => ({name})),
      list_complete: next >= keys.length,
      cursor: next >= keys.length ? '' : String(next),
    };
  }
}

function request(path, options = {}) {
  return new Request(`https://registry.test${path}`, options);
}

async function json(response) {
  if (!response.ok) throw new Error(`Unexpected ${response.status}: ${await response.text()}`);
  return response.json();
}

const kv = new MemoryKV();
const env = {TETI: kv, ADMIN_TOKEN: 'test-admin-token'};
const stale = new Date(Date.now() - 20 * 60 * 1000).toISOString();

for (let index = 0; index < 10_000; index += 1) {
  const id = `sim_${index.toString().padStart(5, '0')}`;
  kv.values.set(`teti:${id}`, JSON.stringify({
    version: 1,
    id,
    address: `${id}@example.test`,
    publicProfile: {name: `Simulation ${index}`, platform: 'test', category: ['simulation']},
    createdAt: stale,
    updatedAt: stale,
    lastSeenAt: stale,
  }));
}

const rebuild = await json(await worker.fetch(request('/api/admin/rebuild-index', {
  method: 'POST',
  headers: {'x-admin-token': 'test-admin-token'},
}), env));
if (rebuild.rebuilt.registryCount !== 10_000 || kv.listCalls < 10) {
  throw new Error('Rebuild did not page through all 10,000 records.');
}

for (let index = 0; index < 1_000; index += 1) {
  const id = `sim_${index.toString().padStart(5, '0')}`;
  const result = await json(await worker.fetch(request('/api/heartbeat', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({teti_id: id}),
  }), env));
  if (result.skippedWrite) throw new Error(`First heartbeat for ${id} was unexpectedly skipped.`);
}

const duplicateResponse = await worker.fetch(request('/api/heartbeat', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({teti_id: 'sim_00000'}),
}), env);
const duplicate = await json(duplicateResponse);
if (!duplicate.skippedWrite) throw new Error('Duplicate heartbeat was not throttled.');
if (!duplicateResponse.headers.get('cache-control')?.startsWith('no-store')) {
  throw new Error('Mutation response is cacheable.');
}

const desktopHeartbeat = await json(await worker.fetch(request('/heartbeat', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({id: 'sim_00000'}),
}), env));
if (!desktopHeartbeat.success || !desktopHeartbeat.skippedWrite || desktopHeartbeat.data.id !== 'sim_00000') {
  throw new Error('Desktop heartbeat compatibility contract failed.');
}

let scheduledWork;
await worker.scheduled({}, env, {waitUntil: promise => { scheduledWork = promise; }});
await scheduledWork;

kv.listCalls = 0;
const [tetisResponse, firstPageResponse, statsResponse, healthResponse, discoverResponse] = await Promise.all([
  worker.fetch(request('/api/tetis'), env),
  worker.fetch(request('/api/tetis?page=1'), env),
  worker.fetch(request('/api/stats'), env),
  worker.fetch(request('/api/health'), env),
  worker.fetch(request('/discover'), env),
]);
const [tetis, firstPage, stats, health, discover] = await Promise.all([
  json(tetisResponse),
  json(firstPageResponse),
  json(statsResponse),
  json(healthResponse),
  json(discoverResponse),
]);
if (kv.listCalls !== 0 || tetis.meta.listUsed || firstPage.meta.listUsed || stats.meta.listUsed || health.listUsed || !discover.success) {
  throw new Error('A public API used KV.list.');
}
if (tetis.meta.registryCount !== 10_000 || tetis.tetis.length !== 1_000 || stats.registryCount !== 10_000 || stats.activeCount !== 1_000) {
  throw new Error('Aggregates did not report the simulated registry state.');
}
if (tetisResponse.headers.get('cache-control') !== 'public, max-age=30, s-maxage=60' || statsResponse.headers.get('cache-control') !== 'public, max-age=60, s-maxage=120') {
  throw new Error('Public cache headers are missing or incorrect.');
}

const bucketWrites = kv.puts.filter(key => key.startsWith('registry:active:bucket:'));
const bucketCounts = new Map();
for (const key of bucketWrites) bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
if (bucketCounts.size < 24 || Math.max(...bucketCounts.values()) > 50) {
  throw new Error('Heartbeat writes were not sufficiently distributed across active buckets.');
}

const uninitializedKv = new MemoryKV();
const existingId = 'teti_existing';
uninitializedKv.values.set(`teti:${existingId}`, JSON.stringify({
  version: 1,
  id: existingId,
  address: 'existing@mail.seep.im',
  publicKey: 'public-test-key',
  publicProfile: {platform: 'test', category: ['simulation'], aiEnvironment: [], lastSeen: stale},
  createdAt: stale,
  updatedAt: stale,
  lastSeen: stale,
}));
const uninitializedEnv = {TETI: uninitializedKv, ADMIN_TOKEN: 'test-admin-token'};
await json(await worker.fetch(request('/register', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({
    version: 1,
    id: existingId,
    address: 'existing@mail.seep.im',
    publicKey: 'public-test-key',
    publicProfile: {platform: 'test', category: ['simulation'], aiEnvironment: [], lastSeen: stale},
  }),
}), uninitializedEnv));
if (uninitializedKv.values.has('registry:stats')) {
  throw new Error('Existing records must not initialize an unknown registry count to zero.');
}
const uninitializedStats = await json(await worker.fetch(request('/api/stats'), uninitializedEnv));
if (uninitializedStats.registryCount !== null || uninitializedStats.meta.source !== 'uninitialized') {
  throw new Error('Unknown registry count must be reported as uninitialized.');
}

console.log(JSON.stringify({
  registryCount: stats.registryCount,
  activeCount: stats.activeCount,
  publicListCalls: kv.listCalls,
  bucketKeysWritten: bucketCounts.size,
  maxWritesPerBucket: Math.max(...bucketCounts.values()),
  duplicateHeartbeatSkipped: duplicate.skippedWrite,
  unknownCountProtected: true,
}, null, 2));
