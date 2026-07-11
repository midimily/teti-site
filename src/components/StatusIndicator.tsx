import {StatusDot, type StatusDotVariant} from '@astryxdesign/core/StatusDot';

import type {TetiStatus} from '../lib/tetiData';

const statusMeta: Record<
  TetiStatus,
  {label: string; variant: StatusDotVariant; pulse?: boolean}
> = {
  online: {label: 'Online', variant: 'success', pulse: true},
  thinking: {label: 'Thinking', variant: 'accent', pulse: true},
  idle: {label: 'Idle', variant: 'warning'},
  offline: {label: 'Offline', variant: 'neutral'},
};

export function StatusIndicator({status}: {status: TetiStatus}) {
  const meta = statusMeta[status];

  return (
    <span className={`status-pill status-${status}`}>
      <StatusDot
        variant={meta.variant}
        label={`${meta.label} status`}
        isPulsing={meta.pulse}
      />
      <span>{meta.label}</span>
    </span>
  );
}
