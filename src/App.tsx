import {useCallback, useEffect, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';

import {DownloadBanner} from './components/DownloadBanner';
import {DownloadModal} from './components/DownloadModal';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {IdentityIntro} from './components/IdentityIntro';
import {IdentityPage} from './components/IdentityPage';
import {SiteLink} from './components/SiteLink';
import {Stats} from './components/Stats';
import {TetiList} from './components/TetiList';
import {useI18n} from './i18n';
import {
  appendNetworkSnapshot,
  fetchNetworkSnapshot,
  fetchNetworkWindow,
  type NetworkSnapshot,
  type TetiIdentity,
} from './lib/tetiData';
import type {ConnectionFallbackReason} from './lib/tetiProtocol';
import {usePageMetadata} from './lib/pageMetadata';
import {useSiteRoute} from './lib/siteRouting';
import {tetiTheme} from './theme';

type NetworkState = 'loading' | 'ready' | 'stale' | 'unavailable';
type ConnectFallback = {identity: TetiIdentity; reason: ConnectionFallbackReason} | null;

type HomePageProps = {
  onConnectFallback: (identity: TetiIdentity, reason: ConnectionFallbackReason) => void;
};

function HomePage({onConnectFallback}: HomePageProps) {
  const {t} = useI18n();
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>('loading');
  const [refreshToken, setRefreshToken] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasLoaded = useRef(false);
  const loadedPageCount = useRef(1);
  const refreshController = useRef<AbortController | null>(null);

  usePageMetadata(t('meta.title'), t('meta.description'), '/');

  const refresh = useCallback(() => setRefreshToken(value => value + 1), []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      refreshController.current?.abort();
      const controller = new AbortController();
      refreshController.current = controller;
      try {
        const nextWindow = await fetchNetworkWindow({
          pageCount: loadedPageCount.current,
          signal: controller.signal,
        });
        if (!isMounted) return;
        loadedPageCount.current = nextWindow.loadedPageCount;
        setSnapshot(nextWindow.snapshot);
        setNetworkState('ready');
        hasLoaded.current = true;
      } catch (error) {
        if (!isMounted || controller.signal.aborted) return;
        setNetworkState(hasLoaded.current ? 'stale' : 'unavailable');
      }
    };

    void load();
    const timer = window.setInterval(load, 10000);
    return () => {
      isMounted = false;
      refreshController.current?.abort();
      window.clearInterval(timer);
    };
  }, [refreshToken]);

  const loadMore = async () => {
    const cursor = snapshot?.page.nextCursor;
    if (!cursor || isLoadingMore) return;
    refreshController.current?.abort();
    setIsLoadingMore(true);
    try {
      const next = await fetchNetworkSnapshot({cursor});
      setSnapshot(appendNetworkSnapshot(snapshot, next));
      loadedPageCount.current += 1;
      setNetworkState('ready');
    } catch {
      setNetworkState(snapshot ? 'stale' : 'unavailable');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
      <Hero />
      <Stats stats={snapshot?.stats ?? null} />
      <IdentityIntro />
      <TetiList
        identities={snapshot?.identities ?? null}
        page={snapshot?.page ?? null}
        publicCount={snapshot?.stats.publicTetis ?? null}
        state={networkState}
        isLoadingMore={isLoadingMore}
        onRetry={refresh}
        onLoadMore={() => void loadMore()}
        onConnectFallback={onConnectFallback}
      />
      <DownloadBanner />
    </>
  );
}

function SiteNotFound() {
  const {t} = useI18n();
  usePageMetadata(t('pageNotFound.metaTitle'), t('pageNotFound.body'), window.location.pathname);
  return (
    <section className="identity-profile" aria-labelledby="site-not-found-title">
      <div className="identity-state">
        <span className="section-eyebrow">teti.bot</span>
        <h1 id="site-not-found-title">{t('pageNotFound.title')}</h1>
        <p>{t('pageNotFound.body')}</p>
        <SiteLink className="text-action" href="/">
          {t('pageNotFound.home')}
        </SiteLink>
      </div>
    </section>
  );
}

export default function App() {
  const route = useSiteRoute();
  const [connectFallback, setConnectFallback] = useState<ConnectFallback>(null);
  const onConnectFallback = (identity: TetiIdentity, reason: ConnectionFallbackReason) =>
    setConnectFallback({identity, reason});

  return (
    <Theme theme={tetiTheme}>
      <div className="app-shell" id="top">
        <Header isHome={route.kind === 'home'} />
        <main>
          {route.kind === 'home' ? (
            <HomePage onConnectFallback={onConnectFallback} />
          ) : route.kind === 'identity' ? (
            <IdentityPage tetiId={route.tetiId} onConnectFallback={onConnectFallback} />
          ) : (
            <SiteNotFound />
          )}
        </main>
        <Footer />
      </div>
      <DownloadModal fallback={connectFallback} onClose={() => setConnectFallback(null)} />
    </Theme>
  );
}
