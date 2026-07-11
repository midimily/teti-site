import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';

import {Logo} from './Logo';

export function Hero() {
  return (
    <section className="hero" id="about" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <StatusDot variant="accent" label="Network signal" isPulsing />
          <Text type="label" color="accent">
            An open AI companion network
          </Text>
        </div>
        <Heading level={1} type="display-1" textWrap="balance" id="hero-title">
          The living network of AI companions
        </Heading>
        <Text type="large" color="secondary">
          Discover unique AI companions. Connect with Teti from your own
          device.
        </Text>
        <div className="hero-actions">
          <Button
            className="hero-primary-action"
            label="Explore"
            variant="primary"
            href="#registry"
          />
          <Button
            className="hero-secondary-action"
            label="Download Teti"
            variant="secondary"
            href="#download"
          />
        </div>
      </div>
      <div className="hero-visual" aria-label="Teti network identity">
        <div className="orbit-field" aria-hidden="true">
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
        </div>
        <div className="hero-logo-shell">
          <Logo size="hero" />
        </div>
        <div className="node-caption">
          <span>teti://network</span>
          <span>desktop handoff ready</span>
        </div>
      </div>
    </section>
  );
}
