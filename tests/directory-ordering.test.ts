import assert from 'node:assert/strict';
import test from 'node:test';

import {groupDirectoryIdentities} from '../src/lib/directoryOrdering.ts';
import type {TetiIdentity, TetiPresence} from '../src/lib/tetiData.ts';

function identity(id: string, displayName: string | null, presence: TetiPresence): TetiIdentity {
  return {id, displayName, presence, summary: null, capabilities: []};
}

test('groups available identities first and sorts each group by localized display name', () => {
  const identities = [
    identity('teti_z00000001', null, 'available'),
    identity('teti_y00000001', 'Teti 10', 'available'),
    identity('teti_x00000001', 'Teti 2', 'available'),
    identity('teti_b00000001', 'Alpha', 'available'),
    identity('teti_a00000001', 'alpha', 'available'),
    identity('teti_c00000001', 'Beta', 'unavailable'),
  ];
  const originalOrder = identities.map(item => item.id);

  const groups = groupDirectoryIdentities(identities, 'en');

  assert.deepEqual(groups.map(group => group.presence), ['available', 'unavailable']);
  assert.deepEqual(
    groups[0].identities.map(item => item.id),
    [
      'teti_a00000001',
      'teti_b00000001',
      'teti_x00000001',
      'teti_y00000001',
      'teti_z00000001',
    ],
  );
  assert.deepEqual(identities.map(item => item.id), originalOrder);
});

test('omits empty presence groups', () => {
  const groups = groupDirectoryIdentities(
    [identity('teti_a00000001', 'Only Teti', 'unavailable')],
    'zh',
  );
  assert.deepEqual(groups.map(group => group.presence), ['unavailable']);
});
