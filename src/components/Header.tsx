import {Button} from '@astryxdesign/core/Button';

import {useI18n} from '../i18n';
import {Logo} from './Logo';
import {SiteLink} from './SiteLink';

export function Header({isHome}: {isHome: boolean}) {
  const {locale, setLocale, t} = useI18n();
  const sectionHref = (hash: string) => `${isHome ? '' : '/'}#${hash}`;

  return (
    <header className="site-header">
      <SiteLink className="brand" href="/" aria-label={t('aria.tetiHome')}>
        <Logo size="header" withWordmark />
      </SiteLink>
      <nav className="header-nav" aria-label={t('aria.primaryNavigation')}>
        <SiteLink href={sectionHref('identity')}>{t('nav.identity')}</SiteLink>
        <SiteLink href={sectionHref('network')}>{t('nav.network')}</SiteLink>
        <Button
          label={t('nav.download')}
          variant="secondary"
          size="sm"
          href={sectionHref('download')}
        />
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
