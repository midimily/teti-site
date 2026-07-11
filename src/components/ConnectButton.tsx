import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';

import type {TetiRecord} from '../lib/tetiData';
import {requestTetiConnection} from '../lib/tetiProtocol';

type ConnectButtonProps = {
  teti: TetiRecord;
  onFallback: (teti: TetiRecord) => void;
};

export function ConnectButton({teti, onFallback}: ConnectButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const isDisabled = teti.status === 'offline';

  return (
    <Button
      className="connect-action"
      label={isOpening ? 'Opening Teti...' : 'Connect'}
      variant={isDisabled ? 'secondary' : 'primary'}
      size="sm"
      isDisabled={isDisabled}
      onClick={() => {
        if (isDisabled) {
          return;
        }
        requestTetiConnection(teti.id, {
          onOpening: () => setIsOpening(true),
          onFallback: () => {
            setIsOpening(false);
            onFallback(teti);
          },
          onFocusReturn: () => setIsOpening(false),
        });
      }}
    />
  );
}
