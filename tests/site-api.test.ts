import assert from 'node:assert/strict';
import test from 'node:test';

import {createSiteApi, type EdgeCache} from '../server/site-api.ts';

const networkHeaders = {
  'Content-Type': 'application/json',
  'Teti-Contract-Revision': '10',
  'Teti-Protocol-Version': '1',
};

function networkFetch(status = 200): typeof fetch {
  return async input => {
    const url = String(input);
    if (url.includes('/v1/public/directory')) {
      return new Response(
        JSON.stringify({
          items: [
            {
              tetiId: 'teti_a83kd9x2q',
              displayName: 'Local Teti',
              summary: 'Local AI identity.',
              capabilityIds: [],
              presence: 'available',
            },
          ],
          page: {limit: 20, returnedCount: 1, nextCursor: null},
        }),
        {status, headers: networkHeaders},
      );
    }
    if (url.includes('/v1/public/stats')) {
      return new Response(
        JSON.stringify({
          activeIdentityCount: 8,
          discoverableNodeCount: 4,
          availableNodeCount: 1,
          generatedAt: '2026-08-13T10:00:00.000Z',
        }),
        {status, headers: networkHeaders},
      );
    }
    return new Response(
      JSON.stringify({
        tetiId: 'teti_a83kd9x2q',
        displayName: 'Local Teti',
        summary: 'Local AI identity.',
        presence: 'unavailable',
        capabilityIds: ['code-analysis', 'research'],
      }),
      {status, headers: networkHeaders},
    );
  };
}

test('maps directory and stats into the Site snapshot contract', async () => {
  const response = await createSiteApi({fetch: networkFetch(), logger: () => {}})(
    new Request('https://teti.bot/api/network?limit=20'),
  );
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('Cache-Control'),
    'public, max-age=0, s-maxage=5, stale-while-revalidate=5',
  );
  assert.deepEqual(await response.json(), {
    identities: [
      {
        id: 'teti_a83kd9x2q',
        displayName: 'Local Teti',
        summary: 'Local AI identity.',
        presence: 'available',
        capabilities: [],
      },
    ],
    page: {limit: 20, returnedCount: 1, nextCursor: null},
    stats: {
      totalTetis: 8,
      publicTetis: 4,
      availableNow: 1,
      generatedAt: '2026-08-13T10:00:00.000Z',
    },
  });
});

test('normalizes human Teti IDs before exact lookup', async () => {
  const urls: string[] = [];
  const response = await createSiteApi({
    fetch: async input => {
      urls.push(String(input));
      return networkFetch()(input);
    },
    logger: () => {},
  })(new Request('https://teti.bot/api/network/identities/%20TETI_A83KD9X2Q%20'));
  assert.equal(response.status, 200);
  assert.match(urls[0], /\/v1\/public\/identities\/teti_a83kd9x2q$/);
  assert.deepEqual(await response.json(), {
    identity: {
      id: 'teti_a83kd9x2q',
      displayName: 'Local Teti',
      summary: 'Local AI identity.',
      presence: 'unavailable',
      capabilities: ['code-analysis', 'research'],
    },
  });

  const invalid = await createSiteApi({fetch: networkFetch(), logger: () => {}})(
    new Request('https://teti.bot/api/network/identities/not-a-teti'),
  );
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('Cache-Control'), 'no-store');
});

test('maps Network failures without turning them into an empty directory', async () => {
  const unavailable = await createSiteApi({
    fetch: async () => {
      throw new Error('offline');
    },
    logger: () => {},
  })(new Request('https://teti.bot/api/network'));
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await unavailable.json(), {error: {code: 'NETWORK_UNAVAILABLE'}});

  const malformed = await createSiteApi({
    fetch: async () => new Response('{}', {headers: networkHeaders}),
    logger: () => {},
  })(new Request('https://teti.bot/api/network'));
  assert.equal(malformed.status, 502);
  assert.deepEqual(await malformed.json(), {error: {code: 'NETWORK_RESPONSE_INVALID'}});
});

test('maps 404 and 429 and preserves Retry-After', async () => {
  const notFound = await createSiteApi({
    fetch: async () =>
      new Response(JSON.stringify({error: {code: 'IDENTITY_NOT_FOUND'}}), {
        status: 404,
        headers: networkHeaders,
      }),
    logger: () => {},
  })(new Request('https://teti.bot/api/network/identities/teti_a83kd9x2q'));
  assert.equal(notFound.status, 404);
  assert.deepEqual(await notFound.json(), {error: {code: 'TETI_NOT_FOUND'}});

  const limited = await createSiteApi({
    fetch: async () =>
      new Response(JSON.stringify({error: {code: 'RATE_LIMITED'}}), {
        status: 429,
        headers: {...networkHeaders, 'Retry-After': '21'},
      }),
    logger: () => {},
  })(new Request('https://teti.bot/api/network/identities/teti_a83kd9x2q'));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '21');

  const missingDirectoryRoute = await createSiteApi({
    fetch: async () =>
      new Response(JSON.stringify({error: {code: 'ROUTE_NOT_FOUND'}}), {
        status: 404,
        headers: networkHeaders,
      }),
    logger: () => {},
  })(new Request('https://teti.bot/api/network'));
  assert.equal(missingDirectoryRoute.status, 503);
  assert.deepEqual(await missingDirectoryRoute.json(), {error: {code: 'NETWORK_UNAVAILABLE'}});
});

test('uses the edge cache without calling Network', async () => {
  let networkCalls = 0;
  const cachedResponse = new Response(JSON.stringify({cached: true}), {
    headers: {'Cache-Control': 'public, s-maxage=5'},
  });
  const cache: EdgeCache = {
    match: async () => cachedResponse.clone(),
    put: async () => {},
  };
  const response = await createSiteApi({
    cache,
    fetch: async () => {
      networkCalls += 1;
      return networkFetch()('https://network.example/v1/public/stats');
    },
    logger: () => {},
  })(new Request('https://teti.bot/api/network'));
  assert.deepEqual(await response.json(), {cached: true});
  assert.equal(networkCalls, 0);
});

test('uses a canonical exact-identity cache key and bypasses cache read failures', async () => {
  const keys: string[] = [];
  const cache: EdgeCache = {
    match: async request => {
      keys.push(request.url);
      throw new Error('cache unavailable');
    },
    put: async () => {},
  };
  const response = await createSiteApi({
    cache,
    fetch: networkFetch(),
    logger: () => {},
  })(new Request('https://teti.bot/api/network/identities/%20TETI_A83KD9X2Q%20'));
  assert.equal(response.status, 200);
  assert.deepEqual(keys, ['https://teti.bot/api/network/identities/teti_a83kd9x2q']);
});
