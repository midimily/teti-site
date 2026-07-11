import {Button} from '@astryxdesign/core/Button';

import {Logo} from './Logo';

export function Header() {
  return (
    <header className="site-header" aria-label="Teti site header">
      <a className="brand" href="#top" aria-label="Teti.bot home">
        <Logo size="header" withWordmark />
      </a>
      <nav className="header-nav" aria-label="Primary navigation">
        <a href="#registry">Explore</a>
        <a href="#about">About</a>
        <Button
          label="Download Teti"
          variant="secondary"
          size="sm"
          href="#download"
        />
      </nav>
    </header>
  );
}
