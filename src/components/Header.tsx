import {Button} from '@astryxdesign/core/Button';

import {useI18n} from '../i18n';
import {Logo} from './Logo';

export function Header() {
  const {locale, setLocale, t} = useI18n();

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={t('aria.tetiHome')}>
        <Logo size="header" withWordmark />
      </a>
      <nav className="header-nav" aria-label={t('aria.primaryNavigation')}>
        <a href="#identity">{t('nav.identity')}</a>
        <a href="#network">{t('nav.network')}</a>
        <Button label={t('nav.download')} variant="secondary" size="sm" href="#download" />
      </nav>
      <div className="language-switch" role="group" aria-label={t('language.label')}>
        <button
          type="button"
          aria-pressed={locale === 'zh'}
          onClick={() => setLocale('zh')}
        >
          中
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
        >
          EN
        </button>
      </div>
    </header>
  );
}
