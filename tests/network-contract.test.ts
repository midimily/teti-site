import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeTetiId,
  parseDirectory,
  parsePublicIdentity,
  parseStats,
  toSiteNetworkSnapshot,
} from '../server/network-contract.ts';

const identity = {
  tetiId: 'teti_a83kd9x2q',
  displayName: "Meng's Teti",
  summary: 'A local AI identity.',
  presence: 'available',
  capabilityIds: [],
} as const;

test('parses and allowlists a public identity', () => {
  assert.deepEqual(parsePublicIdentity({...identity, delivery: {address: 'private@example'}}), identity);
  assert.deepEqual(
    parsePublicIdentity({...identity, capabilityIds: ['code-analysis', 'research']}),
    {...identity, capabilityIds: ['code-analysis', 'research']},
  );
  assert.throws(() => parsePublicIdentity({...identity, presence: 'online'}));
  assert.throws(() => parsePublicIdentity({...identity, tetiId: 'TETI_A83KD9X2Q'}));
  assert.throws(() => parsePublicIdentity({...identity, capabilityIds: undefined}));
  assert.throws(() => parsePublicIdentity({...identity, capabilityIds: ['research', 'coding']}));
  assert.throws(() => parsePublicIdentity({...identity, capabilityIds: ['Code Analysis']}));
  assert.throws(() => parsePublicIdentity({...identity, capabilityIds: ['a'.repeat(65)]}));
});

test('validates directory pagination and stable ordering', () => {
  const directory = parseDirectory({
    items: [identity, {...identity, tetiId: 'teti_b83kd9x2q', presence: 'unavailable'}],
    page: {limit: 20, returnedCount: 2, nextCursor: null},
  });
  assert.equal(directory.items.length, 2);
  assert.throws(() =>
    parseDirectory({
      items: [identity, identity],
      page: {limit: 20, returnedCount: 2, nextCursor: null},
    }),
  );
  assert.throws(() =>
    parseDirectory({
      items: [{...identity, tetiId: 'teti_b83kd9x2q'}, identity],
      page: {limit: 20, returnedCount: 2, nextCursor: null},
    }),
  );
});

test('validates public stats invariants and maps a site snapshot', () => {
  const stats = parseStats({
    activeIdentityCount: 8,
    discoverableNodeCount: 4,
    availableNodeCount: 1,
    generatedAt: '2026-08-13T10:00:00.000Z',
  });
  assert.throws(() => parseStats({...stats, availableNodeCount: 5}));
  const snapshot = toSiteNetworkSnapshot(
    parseDirectory({items: [identity], page: {limit: 20, returnedCount: 1, nextCursor: null}}),
    stats,
  );
  assert.deepEqual(snapshot.stats, {
    totalTetis: 8,
    publicTetis: 4,
    availableNow: 1,
    generatedAt: '2026-08-13T10:00:00.000Z',
  });
  assert.deepEqual(snapshot.identities[0], {
    id: identity.tetiId,
    displayName: identity.displayName,
    summary: identity.summary,
    presence: identity.presence,
    capabilities: identity.capabilityIds,
  });
});

test('normalizes human-entered Teti IDs without changing Network canonical semantics', () => {
  assert.equal(normalizeTetiId('  TETI_A83KD9X2Q  '), 'teti_a83kd9x2q');
  assert.equal(normalizeTetiId('not-a-teti'), null);
});
