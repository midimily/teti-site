import {useEffect} from 'react';

export function usePageMetadata(title: string, description: string, canonicalPath: string): void {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = new URL(canonicalPath, 'https://teti.bot').href;
  }, [canonicalPath, description, title]);
}
