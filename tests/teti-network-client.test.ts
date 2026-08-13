import assert from 'node:assert/strict';
import test from 'node:test';

import {TetiNetworkClient, TetiNetworkClientError} from '../server/teti-network-client.ts';

const responseHeaders = {
  'Content-Type': 'application/json',
  'Teti-Contract-Revision': '10',
  'Teti-Protocol-Version': '1',
};

test('calls the Revision 10 Public Surface with Beta 1.1 protocol headers', async () => {
  const requests: Request[] = [];
  const client = new TetiNetworkClient({
    origin: 'https://network.example',
    fetch: async (input, init) => {
      requests.push(input instanceof Request ? input : new Request(input, init));
      return new Response(
        JSON.stringify({
          items: [],
          page: {limit: 4, returnedCount: 0, nextCursor: null},
        }),
        {headers: responseHeaders},
      );
    },
  });
  await client.listPublicIdentities({limit: '4'});
  assert.equal(requests[0].url, 'https://network.example/v1/public/directory?limit=4');
  assert.equal(requests[0].headers.get('Teti-Protocol-Version'), '1');
  assert.equal(requests[0].headers.get('Teti-Client-Platform'), 'web');
  assert.equal(requests[0].headers.get('Teti-Client-Version'), '1.1.0-beta.1');
});

test('preserves the runtime receiver when using the global fetch implementation', async () => {
  const originalFetch = globalThis.fetch;
  let receiverWasGlobal = false;
  globalThis.fetch = async function (this: typeof globalThis) {
    receiverWasGlobal = this === globalThis;
    return new Response(
      JSON.stringify({
        activeIdentityCount: 0,
        discoverableNodeCount: 0,
        availableNodeCount: 0,
        generatedAt: '2026-08-13T10:00:00.000Z',
      }),
      {headers: responseHeaders},
    );
  } as typeof fetch;

  try {
    const client = new TetiNetworkClient({origin: 'https://network.example'});
    await client.getPublicStats();
    assert.equal(receiverWasGlobal, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('normalizes 404, 429, and malformed responses', async () => {
  const notFound = new TetiNetworkClient({
    origin: 'https://network.example',
    fetch: async () =>
      new Response(JSON.stringify({error: {code: 'IDENTITY_NOT_FOUND'}}), {
        status: 404,
        headers: {...responseHeaders, 'Cache-Control': 'no-store'},
      }),
  });
  await assert.rejects(notFound.getPublicIdentity('teti_a83kd9x2q'), error => {
    assert.ok(error instanceof TetiNetworkClientError);
    assert.equal(error.status, 404);
    assert.equal(error.networkCode, 'IDENTITY_NOT_FOUND');
    return true;
  });

  const limited = new TetiNetworkClient({
    origin: 'https://network.example',
    fetch: async () =>
      new Response(JSON.stringify({error: {code: 'RATE_LIMITED'}}), {
        status: 429,
        headers: {...responseHeaders, 'Retry-After': '12'},
      }),
  });
  await assert.rejects(limited.getPublicStats(), error => {
    assert.ok(error instanceof TetiNetworkClientError);
    assert.equal(error.retryAfterSeconds, 12);
    return true;
  });

  const malformed = new TetiNetworkClient({
    origin: 'https://network.example',
    fetch: async () => new Response('{', {headers: responseHeaders}),
  });
  await assert.rejects(malformed.getPublicStats(), error => {
    assert.ok(error instanceof TetiNetworkClientError);
    assert.equal(error.kind, 'invalid-response');
    return true;
  });
});

test('rejects success from an incompatible contract revision', async () => {
  const client = new TetiNetworkClient({
    origin: 'https://network.example',
    fetch: async () =>
      new Response(
        JSON.stringify({
          activeIdentityCount: 1,
          discoverableNodeCount: 1,
          availableNodeCount: 0,
          generatedAt: '2026-08-13T10:00:00.000Z',
        }),
        {headers: {...responseHeaders, 'Teti-Contract-Revision': '9'}},
      ),
  });
  await assert.rejects(client.getPublicStats(), error => {
    assert.ok(error instanceof TetiNetworkClientError);
    assert.equal(error.kind, 'invalid-response');
    return true;
  });
});

test('retries one transient gateway failure but not a 500', async () => {
  let gatewayCalls = 0;
  const gateway = new TetiNetworkClient({
    origin: 'https://network.example',
    retryDelayMs: 0,
    fetch: async () => {
      gatewayCalls += 1;
      if (gatewayCalls === 1) {
        return new Response(JSON.stringify({error: {code: 'INTERNAL_ERROR'}}), {
          status: 502,
          headers: responseHeaders,
        });
      }
      return new Response(
        JSON.stringify({
          activeIdentityCount: 0,
          discoverableNodeCount: 0,
          availableNodeCount: 0,
          generatedAt: '2026-08-13T10:00:00.000Z',
        }),
        {headers: responseHeaders},
      );
    },
  });
  await gateway.getPublicStats();
  assert.equal(gatewayCalls, 2);

  let serverCalls = 0;
  const serverFailure = new TetiNetworkClient({
    origin: 'https://network.example',
    retryDelayMs: 0,
    fetch: async () => {
      serverCalls += 1;
      return new Response(JSON.stringify({error: {code: 'INTERNAL_ERROR'}}), {
        status: 500,
        headers: responseHeaders,
      });
    },
  });
  await assert.rejects(serverFailure.getPublicStats());
  assert.equal(serverCalls, 1);
});

test('times out a stalled Network request', async () => {
  const client = new TetiNetworkClient({
    origin: 'https://network.example',
    timeoutMs: 5,
    retryDelayMs: 0,
    fetch: async (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
  });
  await assert.rejects(client.getPublicStats(), error => {
    assert.ok(error instanceof TetiNetworkClientError);
    assert.equal(error.kind, 'timeout');
    return true;
  });
});
