export type ConnectionFallbackReason = 'app-not-opened' | 'mobile';

type RequestTetiConnectionOptions = {
  onOpening?: () => void;
  onFallback?: (reason: ConnectionFallbackReason) => void;
  onHandedOff?: () => void;
  fallbackDelayMs?: number;
};

export const downloadLinks = {
  macos: 'https://github.com/midimily/teti-bot/releases/tag/v0.5.3-rc.1',
  macosVersion: 'https://github.com/midimily/teti-bot/releases/tag/v0.5.3-rc.1',
  windows: 'https://github.com/midimily/teti-bot/releases/tag/v0.5.3-rc.1',
};

export function getTetiConnectUrl(tetiId: string) {
  return `teti://connect/${encodeURIComponent(tetiId)}`;
}

export function isLikelyMobileDevice() {
  return (
    window.matchMedia('(pointer: coarse)').matches &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

export function requestTetiConnection(
  tetiId: string,
  {
    onOpening,
    onFallback,
    onHandedOff,
    fallbackDelayMs = 1600,
  }: RequestTetiConnectionOptions = {},
) {
  if (isLikelyMobileDevice()) {
    onFallback?.('mobile');
    return () => {};
  }

  onOpening?.();
  let settled = false;

  const finish = (kind: 'fallback' | 'handoff') => {
    if (settled) return;
    settled = true;
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (kind === 'handoff') onHandedOff?.();
    else onFallback?.('app-not-opened');
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') finish('handoff');
  };
  const fallbackTimer = window.setTimeout(() => finish('fallback'), fallbackDelayMs);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.location.assign(getTetiConnectUrl(tetiId));

  return () => {
    settled = true;
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
