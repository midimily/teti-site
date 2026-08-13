import {useSyncExternalStore} from 'react';

export const TETI_ID_PATTERN = /^teti_[a-z0-9]{9}$/;

export type SiteRoute =
  | {kind: 'home'}
  | {kind: 'identity'; tetiId: string}
  | {kind: 'not-found'};

const ROUTE_CHANGE_EVENT = 'teti:route-change';

export function parseSiteRoute(pathname: string): SiteRoute {
  if (pathname === '/') return {kind: 'home'};
  const match = /^\/(teti_[a-z0-9]{9})\/?$/.exec(pathname);
  return match ? {kind: 'identity', tetiId: match[1]} : {kind: 'not-found'};
}

export function identityPath(tetiId: string): string {
  if (!TETI_ID_PATTERN.test(tetiId)) throw new Error('Invalid canonical Teti ID');
  return `/${tetiId}`;
}

export function canonicalIdentityUrl(tetiId: string): string {
  return `https://teti.bot${identityPath(tetiId)}`;
}

export function navigateTo(href: string): void {
  const next = new URL(href, window.location.origin);
  if (next.origin !== window.location.origin) {
    window.location.assign(next.href);
    return;
  }
  window.history.pushState(null, '', `${next.pathname}${next.search}${next.hash}`);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  window.requestAnimationFrame(() => {
    const target = next.hash ? document.getElementById(next.hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({top: 0});
  });
}

export function useSiteRoute(): SiteRoute {
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname, () => '/');
  return parseSiteRoute(pathname);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(ROUTE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(ROUTE_CHANGE_EVENT, onChange);
  };
}
