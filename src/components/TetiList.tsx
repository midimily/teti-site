import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';

import type {TetiRecord} from '../lib/tetiData';
import {TetiRow} from './TetiRow';

type TetiListProps = {
  tetis: TetiRecord[];
  onConnectFallback: (teti: TetiRecord) => void;
};

export function TetiList({tetis, onConnectFallback}: TetiListProps) {
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
        <span className="registry-count">{tetis.length} network nodes</span>
      </div>
      <ul className="teti-list" role="list">
        {tetis.map(teti => (
          <TetiRow
            key={teti.id}
            teti={teti}
            onConnectFallback={onConnectFallback}
          />
        ))}
      </ul>
    </section>
  );
}
