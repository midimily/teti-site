import {Badge} from '@astryxdesign/core/Badge';
import {Text} from '@astryxdesign/core/Text';

import type {TetiRecord} from '../lib/tetiData';
import {ConnectButton} from './ConnectButton';
import {Logo} from './Logo';
import {StatusIndicator} from './StatusIndicator';

type TetiRowProps = {
  teti: TetiRecord;
  onConnectFallback: (teti: TetiRecord) => void;
};

export function TetiRow({teti, onConnectFallback}: TetiRowProps) {
  return (
    <li className="teti-row">
      <div className="teti-avatar" aria-hidden="true">
        <Logo size="header" />
        <span className={`avatar-status avatar-status-${teti.status}`} />
      </div>
      <div className="teti-main">
        <div className="teti-titleline">
          <strong>{teti.name}</strong>
          <span>{teti.handle}</span>
          <StatusIndicator status={teti.status} />
        </div>
        <Text type="supporting" color="secondary">
          {teti.summary}
        </Text>
        <div className="skill-badges" aria-label={`${teti.name} skills`}>
          {teti.capabilities.map(capability => (
            <Badge key={capability} label={capability} variant="neutral" />
          ))}
        </div>
      </div>
      <div className="teti-side">
        <span>{teti.signal}</span>
        <ConnectButton teti={teti} onFallback={onConnectFallback} />
      </div>
    </li>
  );
}
