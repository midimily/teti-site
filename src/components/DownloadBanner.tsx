import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Apple, ArrowUpRight, Monitor} from 'lucide-react';

import {useI18n} from '../i18n';
import {downloadLinks} from '../lib/tetiProtocol';
import {Logo} from './Logo';

export function DownloadBanner() {
  const {t} = useI18n();

  return (
    <section className="download-section" id="download" aria-labelledby="download-title">
      <div className="download-intro">
        <div className="download-mark" aria-hidden="true"><Logo size="banner" /></div>
        <div className="download-copy">
          <span className="section-eyebrow">{t('download.eyebrow')}</span>
          <Heading level={2} type="display-3" id="download-title">
            {t('download.title')}
          </Heading>
          <p>{t('download.description')}</p>
        </div>
      </div>
      <div className="download-platforms">
        <article className="download-platform-card" data-platform="macos">
          <div className="download-platform-heading">
            <span className="download-platform-icon" aria-hidden="true"><Apple size={22} /></span>
            <div>
              <span>{t('download.platform')}</span>
              <strong>{t('download.macos.name')}</strong>
            </div>
            <span className="download-status">{t('download.macos.status')}</span>
          </div>
          <dl className="download-platform-meta">
            <div>
              <dt>{t('download.compatibility')}</dt>
              <dd>{t('download.macos.compatibility')}</dd>
            </div>
            <div>
              <dt>{t('download.version')}</dt>
              <dd>
                <a href={downloadLinks.macosVersion} target="_blank" rel="noreferrer">
                  {t('download.macos.version')}
                </a>
              </dd>
            </div>
          </dl>
          <Button
            className="download-platform-action"
            label={t('download.macos.action')}
            variant="primary"
            href={downloadLinks.macos}
            target="_blank"
            rel="noreferrer"
            endContent={<ArrowUpRight size={16} aria-hidden="true" />}
          />
        </article>

        <article className="download-platform-card" data-platform="windows">
          <div className="download-platform-heading">
            <span className="download-platform-icon" aria-hidden="true"><Monitor size={22} /></span>
            <div>
              <span>{t('download.platform')}</span>
              <strong>{t('download.windows.name')}</strong>
            </div>
            <span className="download-status is-preview">{t('download.windows.status')}</span>
          </div>
          <dl className="download-platform-meta">
            <div>
              <dt>{t('download.compatibility')}</dt>
              <dd>{t('download.windows.compatibility')}</dd>
            </div>
            <div>
              <dt>{t('download.version')}</dt>
              <dd>
                <a href={downloadLinks.windows} target="_blank" rel="noreferrer">
                  {t('download.windows.version')}
                </a>
              </dd>
            </div>
          </dl>
          <Button
            className="download-platform-action"
            label={t('download.windows.action')}
            variant="primary"
            href={downloadLinks.windows}
            target="_blank"
            rel="noreferrer"
            endContent={<ArrowUpRight size={16} aria-hidden="true" />}
          />
        </article>
      </div>
    </section>
  );
}
