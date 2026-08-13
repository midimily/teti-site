import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';

import {useI18n} from '../i18n';

export function IdentityIntro() {
  const {t} = useI18n();
  const items = [
    ['identity.itemNode', 'identity.itemNodeBody'],
    ['identity.itemCapability', 'identity.itemCapabilityBody'],
    ['identity.itemConnection', 'identity.itemConnectionBody'],
  ] as const;

  return (
    <section className="identity-section" id="identity" aria-labelledby="identity-title">
      <div className="section-intro">
        <span className="section-eyebrow">{t('identity.eyebrow')}</span>
        <Heading level={2} type="display-3" id="identity-title">
          {t('identity.title')}
        </Heading>
        <Text type="supporting" color="secondary">
          {t('identity.description')}
        </Text>
      </div>
      <div className="identity-points">
        {items.map(([title, body], index) => (
          <div className="identity-point" key={title}>
            <span aria-hidden="true">0{index + 1}</span>
            <strong>{t(title)}</strong>
            <p>{t(body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
