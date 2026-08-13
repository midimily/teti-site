import {useEffect, useRef, useState, type FormEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Search} from 'lucide-react';

import {useI18n} from '../i18n';
import {
  fetchTetiIdentity,
  SiteApiError,
  type NetworkSnapshot,
  type TetiIdentity,
} from '../lib/tetiData';
import type {ConnectionFallbackReason} from '../lib/tetiProtocol';
import {TetiRow} from './TetiRow';

type TetiListProps = {
  identities: TetiIdentity[] | null;
  page: NetworkSnapshot['page'] | null;
  publicCount: number | null;
  state: 'loading' | 'ready' | 'stale' | 'unavailable';
  isLoadingMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
  onConnectFallback: (identity: TetiIdentity, reason: ConnectionFallbackReason) => void;
};

type LookupState = 'idle' | 'invalid' | 'loading' | 'not-found' | 'failed' | 'found';
const TETI_ID_PATTERN = /^teti_[a-z0-9]{9}$/;

export function TetiList({
  identities,
  page,
  publicCount,
  state,
  isLoadingMore,
  onRetry,
  onLoadMore,
  onConnectFallback,
}: TetiListProps) {
  const {formatNumber, t} = useI18n();
  const [query, setQuery] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [lookupResult, setLookupResult] = useState<TetiIdentity | null>(null);
  const lookupController = useRef<AbortController | null>(null);

  useEffect(() => () => lookupController.current?.abort(), []);

  const submitLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!TETI_ID_PATTERN.test(normalized)) {
      setLookupResult(null);
      setLookupState('invalid');
      return;
    }
    lookupController.current?.abort();
    const controller = new AbortController();
    lookupController.current = controller;
    setLookupResult(null);
    setLookupState('loading');
    try {
      const identity = await fetchTetiIdentity(normalized, controller.signal);
      setLookupResult(identity);
      setLookupState('found');
    } catch (error) {
      if (controller.signal.aborted) return;
      setLookupState(error instanceof SiteApiError && error.status === 404 ? 'not-found' : 'failed');
    }
  };

  const isInitialLoading = state === 'loading' && identities === null;
  const visibleIdentities = identities ?? [];
  const countLabel = isInitialLoading
    ? t('directory.loadingCount')
    : state === 'unavailable'
      ? t('directory.unavailableCount')
      : t('directory.count', {count: formatNumber(publicCount ?? visibleIdentities.length)});
  const lookupMessage =
    lookupState === 'invalid'
      ? t('directory.findInvalid')
      : lookupState === 'not-found'
        ? t('directory.findNotFound')
        : lookupState === 'failed'
          ? t('directory.findFailed')
          : null;

  return (
    <section className="directory-section" id="network" aria-labelledby="directory-title">
      <div className="directory-header">
        <div className="section-intro">
          <span className="section-eyebrow">{t('directory.eyebrow')}</span>
          <Heading level={2} type="display-3" id="directory-title">
            {t('directory.title')}
          </Heading>
          <p>{t('directory.description')}</p>
        </div>
        <span className="directory-count" aria-live="polite">
          {countLabel}
        </span>
      </div>

      <form className="identity-finder" onSubmit={submitLookup} noValidate>
        <label htmlFor="teti-id-lookup">{t('directory.findLabel')}</label>
        <div className="finder-controls">
          <input
            id="teti-id-lookup"
            value={query}
            placeholder={t('directory.findPlaceholder')}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={lookupMessage ? 'lookup-message' : undefined}
            aria-invalid={lookupState === 'invalid'}
            onChange={event => {
              lookupController.current?.abort();
              lookupController.current = null;
              setQuery(event.target.value);
              setLookupResult(null);
              setLookupState('idle');
            }}
          />
          <Button
            label={lookupState === 'loading' ? t('directory.finding') : t('directory.findAction')}
            variant="secondary"
            type="submit"
            isDisabled={lookupState === 'loading'}
            icon={<Search size={16} aria-hidden="true" />}
          />
        </div>
        <div className="lookup-feedback" aria-live="polite">
          {lookupMessage ? <p id="lookup-message">{lookupMessage}</p> : null}
        </div>
      </form>

      {lookupState === 'found' && lookupResult ? (
        <div className="lookup-result">
          <span>{t('directory.findResult')}</span>
          <ul className="teti-list" role="list">
            <TetiRow identity={lookupResult} onConnectFallback={onConnectFallback} />
          </ul>
        </div>
      ) : null}

      {state === 'stale' ? (
        <div className="network-notice" role="status">
          <span>{t('directory.stale')}</span>
          <button type="button" onClick={onRetry}>{t('directory.retry')}</button>
        </div>
      ) : null}

      <ul className="teti-list" role="list" aria-busy={isInitialLoading}>
        {isInitialLoading ? (
          Array.from({length: 3}, (_, index) => (
            <li className="teti-row teti-row-skeleton" key={index} aria-hidden="true">
              <span />
              <div><span /><span /><span /></div>
            </li>
          ))
        ) : state === 'unavailable' ? (
          <li className="directory-message">
            <p>{t('directory.unavailable')}</p>
            <Button label={t('directory.retry')} variant="secondary" size="sm" onClick={onRetry} />
          </li>
        ) : visibleIdentities.length === 0 ? (
          <li className="directory-message"><p>{t('directory.empty')}</p></li>
        ) : (
          visibleIdentities.map(identity => (
            <TetiRow
              key={identity.id}
              identity={identity}
              onConnectFallback={onConnectFallback}
            />
          ))
        )}
      </ul>

      {page?.nextCursor ? (
        <div className="load-more">
          <Button
            label={isLoadingMore ? t('directory.loadingMore') : t('directory.loadMore')}
            variant="secondary"
            isDisabled={isLoadingMore}
            onClick={onLoadMore}
          />
        </div>
      ) : null}
    </section>
  );
}
