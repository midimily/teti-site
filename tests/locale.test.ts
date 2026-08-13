import assert from 'node:assert/strict';
import test from 'node:test';

import {resolveLocale} from '../src/i18n/locale.ts';

for (const language of ['zh', 'zh-CN', 'zh-SG', 'zh-TW', 'zh-HK', 'zh-Hans', 'zh-Hant']) {
  test(`${language} resolves to the shared Chinese interface`, () => {
    assert.equal(resolveLocale(null, [language]), 'zh');
  });
}

for (const language of ['en-US', 'ja-JP', 'ko-KR', 'fr-FR']) {
  test(`${language} resolves to English`, () => {
    assert.equal(resolveLocale(null, [language]), 'en');
  });
}

test('a saved locale takes priority over browser languages', () => {
  assert.equal(resolveLocale('zh', ['en-US']), 'zh');
  assert.equal(resolveLocale('en', ['zh-CN']), 'en');
});
