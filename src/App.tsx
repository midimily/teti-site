import {useEffect, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';

import {DownloadBanner} from './components/DownloadBanner';
import {DownloadModal} from './components/DownloadModal';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {Stats} from './components/Stats';
import {TetiList} from './components/TetiList';
import {fetchStats, fetchTetis, type RegistryStats, type TetiRecord} from './lib/tetiData';
import {tetiTheme} from './theme';
import './styles.css';

export default function App() {
  const [tetis, setTetis] = useState<TetiRecord[] | null>(null);
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [isRegistryUnavailable, setIsRegistryUnavailable] = useState(false);
  const [downloadTeti, setDownloadTeti] = useState<TetiRecord | null>(null);
  const hasLoadedRegistry = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let refreshTimer: number | undefined;

    const refreshRegistry = () => {
      void Promise.all([fetchTetis(), fetchStats()]).then(([nextTetis, nextStats]) => {
        if (!isMounted) {
          return;
        }

        if (nextTetis) {
          setTetis(nextTetis);
          hasLoadedRegistry.current = true;
          setIsRegistryUnavailable(false);
        } else if (!hasLoadedRegistry.current) {
          setIsRegistryUnavailable(true);
        }
        if (nextStats) {
          setStats(nextStats);
        }
      });
    };

    refreshRegistry();
    refreshTimer = window.setInterval(refreshRegistry, 90000);

    return () => {
      isMounted = false;
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
    };
  }, []);

  return (
    <Theme theme={tetiTheme}>
      <div className="page-glow" aria-hidden="true" />
      <div className="app-shell" id="top">
        <Header />
        <main>
          <Hero />
          <Stats stats={stats} />
          <TetiList
            tetis={tetis}
            isUnavailable={isRegistryUnavailable}
            onConnectFallback={setDownloadTeti}
          />
          <DownloadBanner />
        </main>
        <Footer />
      </div>
      <DownloadModal teti={downloadTeti} onClose={() => setDownloadTeti(null)} />
    </Theme>
  );
}
