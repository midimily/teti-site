import {useI18n} from '../i18n';
import {Logo} from './Logo';

export function Footer() {
  const {t} = useI18n();

  return (
    <footer className="site-footer">
      <div>
        <Logo size="header" withWordmark />
        <p>{t('footer.description')}</p>
      </div>
      <nav aria-label={t('aria.footerNavigation')}>
        <a href="https://network.teti.bot" rel="noreferrer" target="_blank">
          {t('footer.networkApi')}
        </a>
        <a href="https://github.com/midimily/teti-site" rel="noreferrer" target="_blank">
          {t('footer.github')}
        </a>
      </nav>
    </footer>
  );
}
