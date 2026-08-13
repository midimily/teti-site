import {StatusDot} from '@astryxdesign/core/StatusDot';

import {useI18n} from '../i18n';
import type {TetiPresence} from '../lib/tetiData';

export function StatusIndicator({presence}: {presence: TetiPresence}) {
  const {t} = useI18n();
  const label = t(`presence.${presence}`);

  return (
    <span className={`presence presence-${presence}`}>
      <StatusDot variant={presence === 'available' ? 'accent' : 'neutral'} label={label} />
      <span>{label}</span>
    </span>
  );
}
