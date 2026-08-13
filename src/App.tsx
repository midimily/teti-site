import {useCallback, useEffect, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';

import {DownloadBanner} from './components/DownloadBanner';
import {DownloadModal} from './components/DownloadModal';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {IdentityIntro} from './components/IdentityIntro';
import {Stats} from './components/Stats';
import {TetiList} from './components/TetiList';
import {fetchNetworkSnapshot, type NetworkSnapshot, type TetiIdentity} from './lib/tetiData';
import type {ConnectionFallbackReason} from './lib/tetiProtocol';
import {tetiTheme} from './theme';

type NetworkState = 'loading' | 'ready' | 'stale' | 'unavailable';
type ConnectFallback = {identity: TetiIdentity; reason: ConnectionFallbackReason} | null;

export default function App() {
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>('loading');
  const [refreshToken, setRefreshToken] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [connectFallback, setConnectFallback] = useState<ConnectFallback>(null);
  const hasLoaded = useRef(false);

  const refresh = useCallback(() => setRefreshToken(value => value + 1), []);

  useEffect(() => {
    let isMounted = true;
    let activeController: AbortController | null = null;

    const load = async () => {
      activeController?.abort();
      activeController = new AbortController();
      try {
        const nextSnapshot = await fetchNetworkSnapshot({signal: activeController.signal});
        if (!isMounted) return;
        setSnapshot(nextSnapshot);
        setNetworkState('ready');
        hasLoaded.current = true;
      } catch (error) {
        if (!isMounted || activeController.signal.aborted) return;
        setNetworkState(hasLoaded.current ? 'stale' : 'unavailable');
      }
    };

    void load();
    const timer = window.setInterval(load, 10000);
    return () => {
      isMounted = false;
      activeController?.abort();
      window.clearInterval(timer);
    };
  }, [refreshToken]);

  const loadMore = async () => {
    const cursor = snapshot?.page.nextCursor;
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const next = await fetchNetworkSnapshot({cursor});
      setSnapshot(current => {
        if (!current) return next;
        const identities = new Map(current.identities.map(identity => [identity.id, identity]));
        next.identities.forEach(identity => identities.set(identity.id, identity));
        return {...next, identities: [...identities.values()]};
      });
      setNetworkState('ready');
    } catch {
      setNetworkState(snapshot ? 'stale' : 'unavailable');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <Theme theme={tetiTheme}>
      <div className="app-shell" id="top">
        <Header />
        <main>
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
            onConnectFallback={(identity, reason) => setConnectFallback({identity, reason})}
          />
          <DownloadBanner />
        </main>
        <Footer />
      </div>
      <DownloadModal fallback={connectFallback} onClose={() => setConnectFallback(null)} />
    </Theme>
  );
}
