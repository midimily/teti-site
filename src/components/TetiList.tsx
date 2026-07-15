import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';

import type {TetiRecord} from '../lib/tetiData';
import {TetiRow} from './TetiRow';

type TetiListProps = {
  tetis: TetiRecord[] | null;
  isUnavailable: boolean;
  onConnectFallback: (teti: TetiRecord) => void;
};

export function TetiList({
  tetis,
  isUnavailable,
  onConnectFallback,
}: TetiListProps) {
  const isLoading = tetis === null && !isUnavailable;
  const displayedTetis = tetis ?? [];

  return (
    <section className="registry-section" id="registry" aria-labelledby="registry-title">
      <div className="section-heading">
        <div>
          <Heading level={2} type="display-3" id="registry-title">
            Recently Active Teti
          </Heading>
          <Text type="supporting" color="secondary">
            A public registry of companion identities that can hand off into
            Teti Desktop.
          </Text>
        </div>
        <span className="registry-count">
          {isLoading
            ? 'Loading registry'
            : isUnavailable
              ? 'Registry unavailable'
              : `${displayedTetis.length} network nodes`}
        </span>
      </div>
      <ul className="teti-list" role="list" aria-busy={isLoading}>
        {isLoading ? (
          <li className="teti-list-message">Loading active Teti…</li>
        ) : isUnavailable ? (
          <li className="teti-list-message">
            The public registry is temporarily unavailable. Please try again
            shortly.
          </li>
        ) : displayedTetis.length === 0 ? (
          <li className="teti-list-message">No public Teti are active yet.</li>
        ) : (
          displayedTetis.map(teti => (
          <TetiRow
            key={teti.id}
            teti={teti}
            onConnectFallback={onConnectFallback}
          />
          ))
        )}
      </ul>
    </section>
  );
}
