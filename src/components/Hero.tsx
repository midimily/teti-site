import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';
import {ArrowDown, Download} from 'lucide-react';

import {useI18n} from '../i18n';
import {downloadLinks} from '../lib/tetiProtocol';
import {Logo} from './Logo';

export function Hero() {
  const {t} = useI18n();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <StatusDot variant="accent" label={t('hero.eyebrow')} />
          <span>{t('hero.eyebrow')}</span>
        </div>
        <Heading level={1} type="display-1" textWrap="balance" id="hero-title">
          {t('hero.title')}
        </Heading>
        <Text type="large" color="secondary">
          {t('hero.description')}
        </Text>
        <div className="hero-actions">
          <Button
            className="primary-action"
            label={t('hero.explore')}
            variant="primary"
            href="#network"
            endContent={<ArrowDown size={16} aria-hidden="true" />}
          />
          <Button
            label={t('hero.download')}
            variant="secondary"
            href={downloadLinks.macos}
            target="_blank"
            rel="noreferrer"
            icon={<Download size={16} aria-hidden="true" />}
          />
        </div>
      </div>
      <div className="hero-visual" aria-label={t('hero.visualLabel')}>
        <div className="hero-identity-mark">
          <Logo size="hero" />
        </div>
        <div className="hero-node-meta">
          <span>{t('hero.localNode')}</span>
          <span className="node-ready">
            <StatusDot variant="accent" label={t('hero.networkReady')} />
            {t('hero.networkReady')}
          </span>
        </div>
      </div>
    </section>
  );
}
