import {useState, type FormEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Search} from 'lucide-react';

import {useI18n} from '../i18n';
import {groupDirectoryIdentities} from '../lib/directoryOrdering';
import type {NetworkSnapshot, TetiIdentity} from '../lib/tetiData';
import type {ConnectionFallbackReason} from '../lib/tetiProtocol';
import {identityPath, navigateTo, TETI_ID_PATTERN} from '../lib/siteRouting';
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

type LookupState = 'idle' | 'invalid';

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
  const {formatNumber, locale, t} = useI18n();
  const [query, setQuery] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');

  const submitLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!TETI_ID_PATTERN.test(normalized)) {
      setLookupState('invalid');
      return;
    }
    navigateTo(identityPath(normalized));
  };

  const isInitialLoading = state === 'loading' && identities === null;
  const visibleIdentities = identities ?? [];
  const identityGroups = groupDirectoryIdentities(visibleIdentities, locale);
  const countLabel = isInitialLoading
    ? t('directory.loadingCount')
    : state === 'unavailable'
      ? t('directory.unavailableCount')
      : t('directory.count', {count: formatNumber(publicCount ?? visibleIdentities.length)});
  const lookupMessage =
    lookupState === 'invalid' ? t('directory.findInvalid') : null;

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
              setQuery(event.target.value);
              setLookupState('idle');
            }}
          />
          <Button
            label={t('directory.findAction')}
            variant="secondary"
            type="submit"
            icon={<Search size={16} aria-hidden="true" />}
          />
        </div>
        <div className="lookup-feedback" aria-live="polite">
          {lookupMessage ? <p id="lookup-message">{lookupMessage}</p> : null}
        </div>
      </form>

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
          identityGroups.map(group => (
            <li className="teti-group" key={group.presence}>
              <div className="teti-group-header">
                <h3>
                  {t(
                    group.presence === 'available'
                      ? 'directory.groupAvailable'
                      : 'directory.groupUnavailable',
                  )}
                </h3>
                <span>
                  {t('directory.groupCount', {count: formatNumber(group.identities.length)})}
                </span>
              </div>
              <ul className="teti-group-list" role="list">
                {group.identities.map(identity => (
                  <TetiRow
                    key={identity.id}
                    identity={identity}
                    onConnectFallback={onConnectFallback}
                  />
                ))}
              </ul>
            </li>
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
