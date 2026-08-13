import {useEffect, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {ArrowUpRight} from 'lucide-react';

import {useI18n} from '../i18n';
import type {TetiIdentity} from '../lib/tetiData';
import {requestTetiConnection, type ConnectionFallbackReason} from '../lib/tetiProtocol';

type ConnectButtonProps = {
  identity: TetiIdentity;
  onFallback: (identity: TetiIdentity, reason: ConnectionFallbackReason) => void;
};

export function ConnectButton({identity, onFallback}: ConnectButtonProps) {
  const {t} = useI18n();
  const [isOpening, setIsOpening] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isDisabled = identity.presence === 'unavailable';

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <Button
      className="connect-action"
      label={
        isDisabled
          ? t('connect.unavailable')
          : isOpening
            ? t('connect.opening')
            : t('connect.action')
      }
      variant={isDisabled ? 'secondary' : 'primary'}
      size="sm"
      isDisabled={isDisabled || isOpening}
      endContent={!isDisabled && !isOpening ? <ArrowUpRight size={15} aria-hidden="true" /> : null}
      onClick={() => {
        if (isDisabled || isOpening) return;
        cleanupRef.current?.();
        cleanupRef.current = requestTetiConnection(identity.id, {
          onOpening: () => setIsOpening(true),
          onFallback: reason => {
            setIsOpening(false);
            onFallback(identity, reason);
          },
          onHandedOff: () => setIsOpening(false),
        });
      }}
    />
  );
}
