import type {AnchorHTMLAttributes, MouseEvent} from 'react';

import {navigateTo} from '../lib/siteRouting';

type SiteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {href: string};

export function SiteLink({href, onClick, target, ...props}: SiteLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === '_blank'
    ) {
      return;
    }
    event.preventDefault();
    navigateTo(href);
  };

  return <a {...props} href={href} target={target} onClick={handleClick} />;
}
