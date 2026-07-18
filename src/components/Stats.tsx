import type {RegistryStats} from '../lib/tetiData';

export function Stats({stats}: {stats: RegistryStats | null}) {
  const values = [
    {label: 'Recently Active', value: stats ? stats.activeCount.toString() : '—'},
    {label: 'Total Registered', value: stats?.registryCount !== null && stats?.registryCount !== undefined ? stats.registryCount.toString() : '—'},
    {label: 'Recent Index', value: stats?.recentCount !== null && stats?.recentCount !== undefined ? stats.recentCount.toString() : '—'},
  ];

  return (
    <section
      className="network-stats"
      aria-label="Teti network state"
      aria-busy={stats === null}
    >
      {values.map(stat => (
        <div className="network-stat" key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
