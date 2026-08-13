import {useI18n} from '../i18n';
import type {TetiIdentity} from '../lib/tetiData';
import type {ConnectionFallbackReason} from '../lib/tetiProtocol';
import {ConnectButton} from './ConnectButton';
import {Logo} from './Logo';
import {StatusIndicator} from './StatusIndicator';

type TetiRowProps = {
  identity: TetiIdentity;
  onConnectFallback: (identity: TetiIdentity, reason: ConnectionFallbackReason) => void;
};

export function TetiRow({identity, onConnectFallback}: TetiRowProps) {
  const {t} = useI18n();

  return (
    <li className="teti-row">
      <div className="teti-avatar" aria-hidden="true">
        <Logo size="header" />
      </div>
      <div className="teti-main">
        <div className="teti-titleline">
          <strong>{identity.displayName ?? t('identity.unnamed')}</strong>
          <StatusIndicator presence={identity.presence} />
        </div>
        <code>{identity.id}</code>
        <p>{identity.summary ?? t('identity.noSummary')}</p>
      </div>
      <ConnectButton identity={identity} onFallback={onConnectFallback} />
    </li>
  );
}
