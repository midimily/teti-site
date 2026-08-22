import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {ArrowLeft, Check, Link2, RotateCcw} from 'lucide-react';

import {useI18n} from '../i18n';
import {fetchTetiIdentity, SiteApiError, type TetiIdentity} from '../lib/tetiData';
import type {ConnectionFallbackReason} from '../lib/tetiProtocol';
import {usePageMetadata} from '../lib/pageMetadata';
import {canonicalIdentityUrl, formatTetiId, tetiIdValue} from '../lib/siteRouting';
import {ConnectButton} from './ConnectButton';
import {Logo} from './Logo';
import {SiteLink} from './SiteLink';
import {StatusIndicator} from './StatusIndicator';
import {TetiId} from './TetiId';

type IdentityPageProps = {
  tetiId: string;
  onConnectFallback: (identity: TetiIdentity, reason: ConnectionFallbackReason) => void;
};

type IdentityState = 'loading' | 'ready' | 'stale' | 'not-found' | 'network-error';
type CopyState = 'link' | 'failed' | null;

export function IdentityPage({tetiId, onConnectFallback}: IdentityPageProps) {
  const {t} = useI18n();
  const [identity, setIdentity] = useState<TetiIdentity | null>(null);
  const [state, setState] = useState<IdentityState>('loading');
  const [copyState, setCopyState] = useState<CopyState>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const identityRef = useRef<TetiIdentity | null>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    identityRef.current = null;
    setIdentity(null);
    setState('loading');
    let isMounted = true;
    let activeController: AbortController | null = null;

    const load = async () => {
      activeController?.abort();
      activeController = new AbortController();
      try {
        const nextIdentity = await fetchTetiIdentity(tetiId, activeController.signal);
        if (!isMounted) return;
        identityRef.current = nextIdentity;
        setIdentity(nextIdentity);
        setState('ready');
      } catch (error) {
        if (!isMounted || activeController.signal.aborted) return;
        if (error instanceof SiteApiError && error.status === 404) {
          identityRef.current = null;
          setIdentity(null);
          setState('not-found');
          return;
        }
        setState(identityRef.current ? 'stale' : 'network-error');
      }
    };

    void load();
    const timer = window.setInterval(load, 10000);
    return () => {
      isMounted = false;
      activeController?.abort();
      window.clearInterval(timer);
    };
  }, [refreshToken, tetiId]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const pageTitle =
    state === 'not-found'
      ? t('profile.notFoundMetaTitle')
      : identity
        ? t('profile.metaTitle', {name: identity.displayName ?? formatTetiId(identity.id)})
        : t('profile.loadingMetaTitle');
  const pageDescription = identity?.summary ??
    t('profile.metaDescription', {id: tetiIdValue(tetiId)});
  usePageMetadata(pageTitle, pageDescription, `/${tetiId}`);

  const copy = useCallback(async (kind: 'link', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(kind);
    } catch {
      setCopyState('failed');
    }
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState(null), 1800);
  }, []);

  return (
    <section
      className="identity-profile"
      aria-labelledby={state === 'loading' ? undefined : 'identity-profile-title'}
      aria-label={state === 'loading' ? t('profile.loading') : undefined}
    >
      <SiteLink className="identity-back" href="/#network">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('profile.back')}
      </SiteLink>

      {state === 'loading' ? (
        <div className="identity-profile-loading" aria-busy="true" aria-label={t('profile.loading')}>
          <span />
          <span />
          <span />
        </div>
      ) : state === 'not-found' ? (
        <div className="identity-state">
          <span className="section-eyebrow">{t('profile.eyebrow')}</span>
          <h1 id="identity-profile-title">{t('profile.notFoundTitle')}</h1>
          <TetiId tetiId={tetiId} />
          <p>{t('profile.notFoundBody')}</p>
          <SiteLink className="text-action" href="/#network">
            {t('profile.returnToNetwork')}
          </SiteLink>
        </div>
      ) : state === 'network-error' ? (
        <div className="identity-state">
          <span className="section-eyebrow">{t('profile.eyebrow')}</span>
          <h1 id="identity-profile-title">{t('profile.networkErrorTitle')}</h1>
          <TetiId tetiId={tetiId} />
          <p>{t('profile.networkErrorBody')}</p>
          <Button
            label={t('profile.retry')}
            variant="secondary"
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={() => setRefreshToken(value => value + 1)}
          />
        </div>
      ) : identity ? (
        <div className="identity-profile-content">
          {state === 'stale' ? (
            <div className="network-notice" role="status">
              <span>{t('profile.stale')}</span>
              <button type="button" onClick={() => setRefreshToken(value => value + 1)}>
                {t('profile.retry')}
              </button>
            </div>
          ) : null}

          <header className="identity-profile-header">
            <div className="identity-profile-mark" aria-hidden="true">
              <Logo size="banner" />
            </div>
            <div className="identity-profile-heading">
              <span className="section-eyebrow">{t('profile.eyebrow')}</span>
              <h1 id="identity-profile-title">
                {identity.displayName ?? t('identity.unnamed')}
              </h1>
              <div className="identity-profile-idline">
                <TetiId tetiId={identity.id} />
                <StatusIndicator presence={identity.presence} />
              </div>
              <p>{identity.summary ?? t('identity.noSummary')}</p>
            </div>
          </header>

          <div className="identity-profile-actions">
            <ConnectButton identity={identity} onFallback={onConnectFallback} />
            <Button
              label={copyState === 'link' ? t('profile.copiedLink') : t('profile.copyLink')}
              variant="secondary"
              size="sm"
              icon={
                copyState === 'link' ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Link2 size={15} aria-hidden="true" />
                )
              }
              onClick={() => void copy('link', canonicalIdentityUrl(identity.id))}
            />
            <span className="sr-only" aria-live="polite">
              {copyState === 'failed' ? t('profile.copyFailed') : ''}
            </span>
          </div>
          <div className="copy-feedback" aria-live="polite">
            {copyState === 'failed' ? t('profile.copyFailed') : ''}
          </div>

          <section className="identity-capabilities" aria-labelledby="identity-capabilities-title">
            <h2 id="identity-capabilities-title">{t('profile.capabilities')}</h2>
            {identity.capabilities.length > 0 ? (
              <ul>
                {identity.capabilities.map(capability => (
                  <li key={capability}>{formatCapability(capability)}</li>
                ))}
              </ul>
            ) : (
              <p>{t('profile.capabilitiesEmpty')}</p>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function formatCapability(capability: string): string {
  const words = capability.replaceAll('-', ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}
