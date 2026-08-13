import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {ArrowUpRight} from 'lucide-react';

import {useI18n} from '../i18n';
import {downloadLinks} from '../lib/tetiProtocol';
import {Logo} from './Logo';

export function DownloadBanner() {
  const {t} = useI18n();

  return (
    <section className="download-section" id="download" aria-labelledby="download-title">
      <div className="download-mark" aria-hidden="true"><Logo size="banner" /></div>
      <div className="download-copy">
        <span className="section-eyebrow">{t('download.eyebrow')}</span>
        <Heading level={2} type="display-3" id="download-title">
          {t('download.title')}
        </Heading>
        <p>{t('download.description')}</p>
        <span className="download-requirement">{t('download.requirement')}</span>
      </div>
      <Button
        className="primary-action"
        label={t('download.action')}
        variant="primary"
        href={downloadLinks.macos}
        target="_blank"
        rel="noreferrer"
        endContent={<ArrowUpRight size={16} aria-hidden="true" />}
      />
    </section>
  );
}
