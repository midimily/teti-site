import {Logo} from './Logo';

export function Footer() {
  return (
    <footer className="site-footer">
      <Logo size="header" withWordmark />
      <nav aria-label="Footer navigation">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="https://github.com/" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </footer>
  );
}
