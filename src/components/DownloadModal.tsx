import {useEffect, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Check, Copy, X} from 'lucide-react';

import {useI18n} from '../i18n';
import type {TetiIdentity} from '../lib/tetiData';
import type {ConnectionFallbackReason} from '../lib/tetiProtocol';

type DownloadModalProps = {
  fallback: {identity: TetiIdentity; reason: ConnectionFallbackReason} | null;
  onClose: () => void;
};

export function DownloadModal({fallback, onClose}: DownloadModalProps) {
  const {t} = useI18n();
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!fallback) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appShell = document.querySelector<HTMLElement>('.app-shell');
    appShell?.setAttribute('inert', '');
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      appShell?.removeAttribute('inert');
      previousFocus?.focus();
      setCopied(false);
    };
  }, [fallback, onClose]);

  if (!fallback) return null;
  const isMobile = fallback.reason === 'mobile';

  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="download-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-modal-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="icon-button modal-close"
          type="button"
          aria-label={t('connect.close')}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <span className="modal-kicker">{fallback.identity.id}</span>
        <Heading level={2} type="display-3" id="connect-modal-title">
          {t(isMobile ? 'connect.mobileTitle' : 'connect.fallbackTitle')}
        </Heading>
        <p>{t(isMobile ? 'connect.mobileBody' : 'connect.fallbackBody')}</p>
        <div className="modal-actions">
          <Button
            label={copied ? t('connect.copied') : t('connect.copyId')}
            variant="primary"
            icon={copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            onClick={() => {
              void navigator.clipboard
                .writeText(fallback.identity.id)
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          />
          <Button label={t('connect.close')} variant="secondary" onClick={onClose} />
        </div>
      </section>
    </div>
  );
}
