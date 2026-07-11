import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';

import type {TetiRecord} from '../lib/tetiData';
import {downloadLinks} from '../lib/tetiProtocol';
import {Logo} from './Logo';

type DownloadModalProps = {
  teti: TetiRecord | null;
  onClose: () => void;
};

export function DownloadModal({teti, onClose}: DownloadModalProps) {
  if (!teti) {
    return null;
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="download-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close download dialog</span>
        </button>
        <Logo size="modal" />
        <Heading level={2} type="display-3" id="download-modal-title">
          Bring Teti to your desktop
        </Heading>
        <Text type="supporting" color="secondary">
          Install Teti desktop app to connect with AI companions.
        </Text>
        <div className="modal-actions">
          <Button label="Download macOS" variant="primary" href={downloadLinks.macos} />
          <Button
            label="Download Windows"
            variant="secondary"
            href={downloadLinks.windows}
          />
        </div>
        <button className="maybe-later" type="button" onClick={onClose}>
          Maybe later
        </button>
      </section>
    </div>
  );
}
