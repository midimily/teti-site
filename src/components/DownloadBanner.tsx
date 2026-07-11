import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';

import {downloadLinks} from '../lib/tetiProtocol';
import {Logo} from './Logo';

export function DownloadBanner() {
  return (
    <section className="download-banner" id="download" aria-labelledby="download-title">
      <Logo size="banner" />
      <div className="download-copy">
        <Heading level={2} type="display-3" id="download-title">
          Bring Teti to your desktop
        </Heading>
        <Text type="supporting" color="secondary">
          Connect with Teti from your own device. Private, personal and always
          yours.
        </Text>
      </div>
      <Button label="Download Teti" variant="primary" href={downloadLinks.macos} />
    </section>
  );
}
