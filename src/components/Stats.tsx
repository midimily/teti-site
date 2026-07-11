import {useMemo} from 'react';

import type {TetiRecord} from '../lib/tetiData';

export function Stats({tetis}: {tetis: TetiRecord[]}) {
  const stats = useMemo(
    () => [
      {
        label: 'Teti Alive',
        value: tetis.filter(teti => teti.status !== 'offline').length.toString(),
      },
      {label: 'Total Born', value: tetis.length.toString()},
      {
        label: 'Connections',
        value: tetis.filter(teti => teti.status === 'online').length.toString(),
      },
    ],
    [tetis],
  );

  return (
    <section className="network-stats" aria-label="Teti network state">
      {stats.map(stat => (
        <div className="network-stat" key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
