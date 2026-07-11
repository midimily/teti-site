import {useEffect, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';

import {DownloadBanner} from './components/DownloadBanner';
import {DownloadModal} from './components/DownloadModal';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {Stats} from './components/Stats';
import {TetiList} from './components/TetiList';
import {fetchTetis, seedTetis, type TetiRecord} from './lib/tetiData';
import {tetiTheme} from './theme';
import './styles.css';

export default function App() {
  const [tetis, setTetis] = useState<TetiRecord[]>(seedTetis);
  const [downloadTeti, setDownloadTeti] = useState<TetiRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchTetis().then(nextTetis => {
      if (isMounted) {
        setTetis(nextTetis);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Theme theme={tetiTheme}>
      <div className="page-glow" aria-hidden="true" />
      <div className="app-shell" id="top">
        <Header />
        <main>
          <Hero />
          <Stats tetis={tetis} />
          <TetiList tetis={tetis} onConnectFallback={setDownloadTeti} />
          <DownloadBanner />
        </main>
        <Footer />
      </div>
      <DownloadModal teti={downloadTeti} onClose={() => setDownloadTeti(null)} />
    </Theme>
  );
}
