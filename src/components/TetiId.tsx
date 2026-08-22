import {useEffect, useRef, useState} from 'react';
import {Check, Copy} from 'lucide-react';

import {useI18n} from '../i18n';
import {tetiIdValue} from '../lib/siteRouting';
import {SiteLink} from './SiteLink';

type TetiIdProps = {
  tetiId: string;
  href?: string;
  className?: string;
};

type CopyState = 'idle' | 'copied' | 'failed';

export function TetiId({tetiId, href, className}: TetiIdProps) {
  const {t} = useI18n();
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | null>(null);
  const id = tetiIdValue(tetiId);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copyLabel =
    copyState === 'copied'
      ? t('identity.copiedIdValue', {id})
      : copyState === 'failed'
        ? t('identity.copyIdFailed')
        : t('identity.copyIdValue', {id});

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const value = <code>{id}</code>;

  return (
    <span className={['teti-id', className].filter(Boolean).join(' ')}>
      <span className="teti-id-prefix">(id:</span>
      {href ? (
        <SiteLink className="teti-id-value" href={href}>
          {value}
        </SiteLink>
      ) : (
        value
      )}
      <button
        className="teti-id-copy"
        type="button"
        aria-label={copyLabel}
        title={copyLabel}
        data-copy-state={copyState}
        onClick={() => void copyId()}
      >
        {copyState === 'copied' ? (
          <Check size={13} aria-hidden="true" />
        ) : (
          <Copy size={13} aria-hidden="true" />
        )}
      </button>
      <span className="teti-id-parenthesis" aria-hidden="true">)</span>
      <span className="sr-only" aria-live="polite">
        {copyState === 'idle' ? '' : copyLabel}
      </span>
    </span>
  );
}
