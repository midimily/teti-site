export interface Env {
  TETI_REGISTRY?: KVNamespace;
}

type TetiStatus = 'online' | 'thinking' | 'idle' | 'offline';

type TetiRecord = {
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
  id?: string;
  address?: string;
  publicProfile?: {
    name?: string;
    platform?: string;
    category?: string[];
    aiEnvironment?: string[];
    description?: string;
    capabilities?: string[];
  };
  updatedAt?: string;
  createdAt?: string;
};

type TetiRegistryMeta = {
  source: 'registry' | 'legacy' | 'seed';
  kvBound: boolean;
  registryKeyCount: number;
  registryRecordCount: number;
  legacyListFound: boolean;
};

type TetiRegistryResult = {
  tetis: TetiRecord[];
  meta: TetiRegistryMeta;
};

const seedTetis: TetiRecord[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    handle: '@mochi',
    summary:
      'Curious companion for small rituals, messages, and daily context.',
    status: 'online',
    location: 'Recently active',
    capabilities: ['mail', 'coding', 'web'],
    signal: 'Ready for a local connection',
    lastSeen: 'live',
  },
  {
    id: 'kiko',
    name: 'Kiko',
    handle: '@kiko',
    summary: 'Adventure seeker that helps explore places, photos, and maps.',
    status: 'thinking',
    location: 'Network node',
    capabilities: ['explore', 'photo', 'map'],
    signal: 'Preparing a connection window',
    lastSeen: 'active now',
  },
  {
    id: 'panda',
    name: 'Panda',
    handle: '@panda',
    summary:
      'Gentle and calm companion for memory, diary, and reflection.',
    status: 'idle',
    location: 'Quiet mode',
    capabilities: ['memory', 'diary'],
    signal: 'Available when awakened from desktop',
    lastSeen: '12m ago',
  },
  {
    id: 'neko',
    name: 'Neko',
    handle: '@neko',
    summary: 'Coding companion for debugging, learning, and steady focus.',
    status: 'online',
    location: 'Developer workspace',
    capabilities: ['code', 'debug', 'learn'],
    signal: 'Accepting connection requests',
    lastSeen: 'live',
  },
];

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate',
  pragma: 'no-cache',
  expires: '0',
  'access-control-allow-origin': '*',
};

function toTitle(value: string) {
  return value
    .replace(/^teti[_-]?/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, match => match.toUpperCase());
}

function getLastSeen(updatedAt?: string) {
  if (!updatedAt) {
    return 'registered';
  }

  const updatedTime = Date.parse(updatedAt);
  if (!Number.isFinite(updatedTime)) {
    return 'registered';
  }

  const ageMs = Date.now() - updatedTime;
  if (ageMs < 1000 * 60 * 2) {
    return 'live';
  }
  if (ageMs < 1000 * 60 * 60) {
    return `${Math.max(1, Math.floor(ageMs / (1000 * 60)))}m ago`;
  }
  if (ageMs < 1000 * 60 * 60 * 24) {
    return `${Math.floor(ageMs / (1000 * 60 * 60))}h ago`;
  }
  return `${Math.floor(ageMs / (1000 * 60 * 60 * 24))}d ago`;
}

function getStatus(updatedAt?: string): TetiStatus {
  if (!updatedAt) {
    return 'idle';
  }

  const updatedTime = Date.parse(updatedAt);
  if (!Number.isFinite(updatedTime)) {
    return 'idle';
  }

  const ageMs = Date.now() - updatedTime;
  if (ageMs < 1000 * 60 * 10) {
    return 'online';
  }
  if (ageMs < 1000 * 60 * 60 * 24) {
    return 'thinking';
  }
  return 'idle';
}

function normalizeRegistryDocument(
  raw: RegistryTetiDocument,
): TetiRecord | null {
  if (!raw.id && !raw.address) {
    return null;
  }

  const id = raw.id ?? raw.address ?? 'unknown';
  const addressName = raw.address?.split('@')[0];
  const profile = raw.publicProfile ?? {};
  const capabilities = [
    ...(Array.isArray(profile.category) ? profile.category : []),
    ...(Array.isArray(profile.aiEnvironment) ? profile.aiEnvironment : []),
    ...(Array.isArray(profile.capabilities) ? profile.capabilities : []),
  ]
    .filter(Boolean)
    .slice(0, 4);
  const platform = profile.platform ?? 'Teti network';
  const displayName = profile.name ?? `Teti ${toTitle(addressName ?? id)}`;
  const status = getStatus(raw.updatedAt);

  return {
    id,
    name: displayName,
    handle: `@${addressName ?? id.replace(/^teti[_-]?/, '')}`,
    summary:
      profile.description ??
      `${platform} companion identity registered on the open Teti network.`,
    status,
    location: platform,
    capabilities: capabilities.length > 0 ? capabilities : ['companion'],
    signal:
      status === 'online'
        ? 'Ready for a local connection'
        : 'Available through Teti Desktop',
    lastSeen: getLastSeen(raw.updatedAt ?? raw.createdAt),
  };
}

async function getRegistryTetis(
  env: Env,
): Promise<{records: TetiRecord[]; keyCount: number}> {
  const registry = env.TETI_REGISTRY;
  if (!registry) {
    return {records: [], keyCount: 0};
  }

  const records: TetiRecord[] = [];
  let keyCount = 0;
  let cursor: string | undefined;

  do {
    const listed = await registry.list({prefix: 'teti:', cursor});
    const recordKeys = listed.keys.filter(key => key.name !== 'teti:list');
    keyCount += recordKeys.length;
    const rawValues = await Promise.all(
      recordKeys.map(key => registry.get(key.name)),
    );

    for (const rawValue of rawValues) {
      if (!rawValue) {
        continue;
      }

      try {
        const parsed = JSON.parse(rawValue) as RegistryTetiDocument;
        const record = normalizeRegistryDocument(parsed);
        if (record) {
          records.push(record);
        }
      } catch {
        // Ignore malformed registry entries so one bad KV value does not hide
        // the rest of the public network list.
      }
    }

    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);

  return {
    keyCount,
    records: records.sort((a, b) => {
      if (a.lastSeen === 'live' && b.lastSeen !== 'live') {
        return -1;
      }
      if (b.lastSeen === 'live' && a.lastSeen !== 'live') {
        return 1;
      }
      return a.name.localeCompare(b.name);
    }),
  };
}

async function getLegacyTetis(
  env: Env,
): Promise<{records: TetiRecord[]; found: boolean}> {
  const raw = await env.TETI_REGISTRY?.get('teti:list');
  if (!raw) {
    return {records: [], found: false};
  }

  try {
    const parsed = JSON.parse(raw);
    return {records: Array.isArray(parsed) ? parsed : [], found: true};
  } catch {
    return {records: [], found: true};
  }
}

async function getTetiRegistry(env: Env): Promise<TetiRegistryResult> {
  const kvBound = Boolean(env.TETI_REGISTRY);
  const registryTetis = await getRegistryTetis(env);
  if (registryTetis.records.length > 0) {
    return {
      tetis: registryTetis.records,
      meta: {
        source: 'registry',
        kvBound,
        registryKeyCount: registryTetis.keyCount,
        registryRecordCount: registryTetis.records.length,
        legacyListFound: false,
      },
    };
  }

  const legacyTetis = await getLegacyTetis(env);
  if (legacyTetis.records.length > 0) {
    return {
      tetis: legacyTetis.records,
      meta: {
        source: 'legacy',
        kvBound,
        registryKeyCount: registryTetis.keyCount,
        registryRecordCount: registryTetis.records.length,
        legacyListFound: legacyTetis.found,
      },
    };
  }

  return {
    tetis: seedTetis,
    meta: {
      source: 'seed',
      kvBound,
      registryKeyCount: registryTetis.keyCount,
      registryRecordCount: registryTetis.records.length,
      legacyListFound: legacyTetis.found,
    },
  };
}

function createConnectIntent(teti: TetiRecord) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5).toISOString();
  return {
    tetiId: teti.id,
    desktopUrl: `teti://connect/${encodeURIComponent(teti.id)}`,
    fallbackDownloadUrl: '/downloads/teti-desktop-mac.dmg',
    expiresAt,
  };
}

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {...jsonHeaders, ...init?.headers},
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
        },
      });
    }

    if (url.pathname === '/api/tetis' && request.method === 'GET') {
      const registry = await getTetiRegistry(env);
      return response(registry);
    }

    const tetiMatch = url.pathname.match(/^\/api\/tetis\/([^/]+)$/);
    if (tetiMatch && request.method === 'GET') {
      const {tetis} = await getTetiRegistry(env);
      const teti = tetis.find(item => item.id === tetiMatch[1]);
      if (!teti) {
        return response({error: 'Teti not found'}, {status: 404});
      }
      return response({teti});
    }

    const connectMatch = url.pathname.match(/^\/api\/tetis\/([^/]+)\/connect$/);
    if (connectMatch && request.method === 'POST') {
      const {tetis} = await getTetiRegistry(env);
      const teti = tetis.find(item => item.id === connectMatch[1]);
      if (!teti) {
        return response({error: 'Teti not found'}, {status: 404});
      }
      if (teti.status === 'offline') {
        return response(
          {error: 'Teti requires desktop sync before connecting'},
          {status: 409},
        );
      }
      return response({connect: createConnectIntent(teti)});
    }

    if (url.pathname === '/api/desktop' && request.method === 'GET') {
      return response({
        desktop: {
          latestVersion: '0.1.0',
          platforms: {
            macos: '/downloads/teti-desktop-mac.dmg',
            windows: '/downloads/teti-desktop-windows.exe',
            linux: '/downloads/teti-desktop-linux.AppImage',
          },
        },
      });
    }

    return response({error: 'Not found'}, {status: 404});
  },
};
