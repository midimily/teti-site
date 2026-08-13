import {useI18n} from '../i18n';
import type {NetworkSnapshot} from '../lib/tetiData';

export function Stats({stats}: {stats: NetworkSnapshot['stats'] | null}) {
  const {formatNumber, t} = useI18n();
  const entries = [
    {label: t('stats.total'), value: stats?.totalTetis},
    {label: t('stats.public'), value: stats?.publicTetis},
    {label: t('stats.available'), value: stats?.availableNow},
  ];

  return (
    <section className="network-stats" aria-label="Teti Network" aria-busy={stats === null}>
      {entries.map(entry => (
        <div className="network-stat" key={entry.label}>
          <strong>{entry.value === undefined ? '—' : formatNumber(entry.value)}</strong>
          <span>{entry.label}</span>
        </div>
      ))}
    </section>
  );
}
