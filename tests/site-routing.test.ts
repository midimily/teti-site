import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalIdentityUrl,
  identityPath,
  parseSiteRoute,
} from '../src/lib/siteRouting.ts';

test('resolves canonical root identity URLs', () => {
  assert.deepEqual(parseSiteRoute('/'), {kind: 'home'});
  assert.deepEqual(parseSiteRoute('/teti_a83kd9x2q'), {
    kind: 'identity',
    tetiId: 'teti_a83kd9x2q',
  });
  assert.deepEqual(parseSiteRoute('/teti_a83kd9x2q/'), {
    kind: 'identity',
    tetiId: 'teti_a83kd9x2q',
  });
});

test('does not reinterpret invalid paths as identities', () => {
  assert.deepEqual(parseSiteRoute('/TETI_A83KD9X2Q'), {kind: 'not-found'});
  assert.deepEqual(parseSiteRoute('/id/teti_a83kd9x2q'), {kind: 'not-found'});
  assert.deepEqual(parseSiteRoute('/teti_missing'), {kind: 'not-found'});
});

test('builds canonical identity paths and share URLs', () => {
  assert.equal(identityPath('teti_a83kd9x2q'), '/teti_a83kd9x2q');
  assert.equal(canonicalIdentityUrl('teti_a83kd9x2q'), 'https://teti.bot/teti_a83kd9x2q');
  assert.throws(() => identityPath('not-a-teti'));
});
