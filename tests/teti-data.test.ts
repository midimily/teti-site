import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendNetworkSnapshot,
  fetchNetworkWindow,
  SiteApiError,
  type NetworkSnapshot,
} from '../src/lib/tetiData.ts';

function snapshot(ids: string[], nextCursor: string | null): NetworkSnapshot {
  return {
    identities: ids.map(id => ({
      id,
      displayName: id,
      presence: 'unavailable',
      summary: null,
      capabilities: [],
    })),
    page: {limit: 2, returnedCount: ids.length, nextCursor},
    stats: {
      totalTetis: 4,
      publicTetis: 4,
      availableNow: 0,
      generatedAt: '2026-08-16T00:00:00.000Z',
    },
  };
}

test('refreshes the same number of directory pages already loaded', async () => {
  const pages = [
    snapshot(['teti_a00000001', 'teti_b00000001'], 'page-2'),
    snapshot(['teti_c00000001', 'teti_d00000001'], null),
  ];
  const cursors: Array<string | undefined> = [];
  const window = await fetchNetworkWindow({
    pageCount: 3,
    fetchPage: async input => {
      cursors.push(input.cursor);
      return pages[cursors.length - 1];
    },
  });

  assert.deepEqual(cursors, [undefined, 'page-2']);
  assert.equal(window.loadedPageCount, 2);
  assert.deepEqual(
    window.snapshot.identities.map(identity => identity.id),
    ['teti_a00000001', 'teti_b00000001', 'teti_c00000001', 'teti_d00000001'],
  );
  assert.equal(window.snapshot.page.nextCursor, null);
});

test('rejects duplicate or out-of-order identities across pages', () => {
  assert.throws(
    () =>
      appendNetworkSnapshot(
        snapshot(['teti_a00000001', 'teti_c00000001'], 'page-2'),
        snapshot(['teti_b00000001'], null),
      ),
    (error: unknown) => error instanceof SiteApiError && error.code === 'NETWORK_RESPONSE_INVALID',
  );
});
