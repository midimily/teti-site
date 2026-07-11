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
  'cache-control': 'public, max-age=30',
  'access-control-allow-origin': '*',
};

async function getTetis(env: Env): Promise<TetiRecord[]> {
  const raw = await env.TETI_REGISTRY?.get('teti:list');
  if (!raw) {
    return seedTetis;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedTetis;
  } catch {
    return seedTetis;
  }
}

function createConnectIntent(teti: TetiRecord) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5).toISOString();
  const intent = {
    tetiId: teti.id,
    source: 'teti.bot',
    expiresAt,
  };
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
      const tetis = await getTetis(env);
      return response({tetis});
    }

    const tetiMatch = url.pathname.match(/^\/api\/tetis\/([^/]+)$/);
    if (tetiMatch && request.method === 'GET') {
      const tetis = await getTetis(env);
      const teti = tetis.find(item => item.id === tetiMatch[1]);
      if (!teti) {
        return response({error: 'Teti not found'}, {status: 404});
      }
      return response({teti});
    }

    const connectMatch = url.pathname.match(/^\/api\/tetis\/([^/]+)\/connect$/);
    if (connectMatch && request.method === 'POST') {
      const tetis = await getTetis(env);
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
