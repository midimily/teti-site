type RequestTetiConnectionOptions = {
  onOpening?: () => void;
  onFallback?: () => void;
  onFocusReturn?: () => void;
  fallbackDelayMs?: number;
};

export const downloadLinks = {
  macos: '/downloads/teti-desktop-mac.dmg',
  windows: '/downloads/teti-desktop-windows.exe',
};

export function getTetiConnectUrl(tetiId: string) {
  return `teti://connect/${encodeURIComponent(tetiId)}`;
}

export function requestTetiConnection(
  tetiId: string,
  {
    onOpening,
    onFallback,
    onFocusReturn,
    fallbackDelayMs = 1600,
  }: RequestTetiConnectionOptions = {},
) {
  onOpening?.();

  let completed = false;
  let fallbackTimer = window.setTimeout(() => {
    completed = true;
    window.removeEventListener('focus', handleFocusReturn);
    onFallback?.();
  }, fallbackDelayMs);

  function handleFocusReturn() {
    if (completed) {
      return;
    }
    completed = true;
    window.clearTimeout(fallbackTimer);
    onFocusReturn?.();
  }

  window.addEventListener('focus', handleFocusReturn, {once: true});

  // Browser custom-protocol support is intentionally best-effort: sites cannot
  // reliably know whether a native app handled `teti://`, so we attempt the
  // handoff and show the desktop download path only if focus does not return.
  window.location.href = getTetiConnectUrl(tetiId);
}
