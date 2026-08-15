import {useEffect, useState, type ReactElement} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  Download,
  FileText,
  Link2,
  Search,
  ShieldCheck,
} from 'lucide-react';

import {useI18n} from '../i18n';
import {downloadLinks} from '../lib/tetiProtocol';

const SLIDES = ['connect', 'passport', 'collaborate'] as const;
const AUTOPLAY_INTERVAL_MS = 5_500;

type SlideName = (typeof SLIDES)[number];

function ConnectScene() {
  const {t} = useI18n();
  return (
    <div className="hero-scene hero-scene-connect" aria-hidden="true">
      <div className="scene-connection-path">
        <span className="scene-teti-avatar scene-teti-avatar-local">
          <img src="/assets/teti-logo-transparent.png" alt="" />
        </span>
        <span className="scene-link-line"><span /></span>
        <span className="scene-teti-avatar scene-teti-avatar-peer">
          <img src="/assets/teti-logo-default.png" alt="" />
        </span>
      </div>
      <div className="scene-connect-panel">
        <div className="scene-input">
          <Search size={14} />
          <span>teti_a1b2c3d4e</span>
        </div>
        <span className="scene-connect-button"><Link2 size={15} /></span>
      </div>
      <div className="scene-peer-row">
        <span className="scene-peer-dot" />
        <span className="scene-peer-copy">
          <strong>Nova</strong>
          <small>teti_a1b2c3d4e</small>
        </span>
        <span className="scene-success"><Check size={12} /> {t('hero.scene.connected')}</span>
      </div>
    </div>
  );
}

function PassportScene() {
  const {t} = useI18n();
  return (
    <div className="hero-scene hero-scene-passport" aria-hidden="true">
      <div className="scene-passport-card">
        <div className="scene-passport-heading">
          <span className="scene-passport-icon"><ShieldCheck size={17} /></span>
          <span>
            <strong>AI Passport</strong>
            <small>{t('hero.scene.sharedBy')}</small>
          </span>
          <span className="scene-live-pill">{t('hero.scene.live')}</span>
        </div>
        <div className="scene-passport-owner">
          <span className="scene-mini-avatar"><img src="/assets/teti-logo-transparent.png" alt="" /></span>
          <span><strong>Nova</strong><small>{t('hero.scene.trusted')}</small></span>
        </div>
        <div className="scene-passport-section-label">{t('hero.scene.aiAgents')}</div>
        <div className="scene-agent-row">
          <span className="scene-agent-icon"><Bot size={16} /></span>
          <span><strong>Codex</strong><small>{t('hero.scene.available')}</small></span>
          <span className="scene-available-dot" />
        </div>
        <div className="scene-passport-section-label">{t('hero.scene.sharedCapabilities')}</div>
        <div className="scene-capability-list">
          <span>{t('hero.scene.code')}</span><span>{t('hero.scene.research')}</span><span>{t('hero.scene.images')}</span>
        </div>
      </div>
    </div>
  );
}

function CollaborateScene() {
  const {t} = useI18n();
  return (
    <div className="hero-scene hero-scene-collaborate" aria-hidden="true">
      <div className="scene-task-route">
        <span className="scene-task-person"><span className="scene-person-avatar">Y</span><small>{t('hero.scene.you')}</small></span>
        <span className="scene-task-arrow"><ArrowRight size={14} /></span>
        <span className="scene-task-person"><span className="scene-person-avatar is-teti"><Bot size={15} /></span><small>Nova</small></span>
      </div>
      <div className="scene-task-card">
        <div className="scene-task-label"><FileText size={14} /> {t('hero.scene.collaborativeTask')}</div>
        <strong>{t('hero.scene.taskTitle')}</strong>
        <p>{t('hero.scene.taskDescription')}</p>
        <div className="scene-task-progress"><span /></div>
        <div className="scene-task-meta"><span>{t('hero.scene.research')} · Codex</span><span className="scene-task-done"><Check size={12} /> {t('hero.scene.done')}</span></div>
      </div>
      <div className="scene-result-card">
        <span className="scene-result-icon"><Check size={13} /></span>
        <span><strong>{t('hero.scene.resultDelivered')}</strong><small>Brief.md · {t('hero.scene.justNow')}</small></span>
      </div>
    </div>
  );
}

const sceneByName: Record<SlideName, () => ReactElement> = {
  connect: ConnectScene,
  passport: PassportScene,
  collaborate: CollaborateScene,
};

function HeroShowcase() {
  const {t} = useI18n();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setActiveSlide(current => (current + 1) % SLIDES.length),
      AUTOPLAY_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeName = SLIDES[activeSlide];

  return (
    <div
      className="hero-showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('hero.visualLabel')}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="hero-product-window">
        <div className="hero-product-bar" aria-hidden="true">
          <span>teti.bot</span>
          <span className="hero-product-eyes"><i /><i /></span>
          <span className="hero-product-tools"><i /><i /><i /></span>
        </div>
        <div className="hero-slide-stack">
          {SLIDES.map((name, index) => {
            const Scene = sceneByName[name];
            return (
              <div
                className="hero-slide"
                data-active={index === activeSlide}
                aria-hidden={index !== activeSlide}
                key={name}
              >
                <Scene />
              </div>
            );
          })}
        </div>
      </div>
      <div className="hero-showcase-caption" aria-live="polite">
        <div className="hero-showcase-copy">
          <span>{t(`hero.slide.${activeName}.kicker`)}</span>
          <strong>{t(`hero.slide.${activeName}.title`)}</strong>
          <p>{t(`hero.slide.${activeName}.description`)}</p>
        </div>
        <div className="hero-slide-controls" role="group" aria-label={t('hero.slideControls')}>
          {SLIDES.map((name, index) => (
            <button
              type="button"
              className="hero-slide-control"
              aria-label={t(`hero.slide.${name}.title`)}
              aria-pressed={index === activeSlide}
              onClick={() => setActiveSlide(index)}
              key={name}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const {t} = useI18n();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <StatusDot variant="accent" label={t('hero.eyebrow')} />
          <span>{t('hero.eyebrow')}</span>
        </div>
        <Heading level={1} type="display-1" textWrap="balance" id="hero-title">
          <span className="hero-title-line hero-title-line-identity">
            {t('hero.titleIdentity')}
          </span>
          <span className="hero-title-line hero-title-line-collaboration">
            {t('hero.titleCollaboration')}
          </span>
        </Heading>
        <Text type="large" color="secondary">
          {t('hero.description')}
        </Text>
        <div className="hero-actions">
          <Button
            className="primary-action"
            label={t('hero.explore')}
            variant="primary"
            href="#network"
            endContent={<ArrowDown size={16} aria-hidden="true" />}
          />
          <Button
            label={t('hero.download')}
            variant="secondary"
            href={downloadLinks.macos}
            target="_blank"
            rel="noreferrer"
            icon={<Download size={16} aria-hidden="true" />}
          />
        </div>
      </div>
      <HeroShowcase />
    </section>
  );
}
