import type {Locale} from '../i18n/locale';
import type {TetiIdentity, TetiPresence} from './tetiData';

export type DirectoryIdentityGroup = {
  presence: TetiPresence;
  identities: TetiIdentity[];
};

const PRESENCE_ORDER: TetiPresence[] = ['available', 'unavailable'];

export function groupDirectoryIdentities(
  identities: readonly TetiIdentity[],
  locale: Locale,
): DirectoryIdentityGroup[] {
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: 'base',
    usage: 'sort',
  });
  const compare = (left: TetiIdentity, right: TetiIdentity) => {
    const leftName = normalizedName(left.displayName);
    const rightName = normalizedName(right.displayName);
    if (leftName === null && rightName !== null) return 1;
    if (leftName !== null && rightName === null) return -1;
    if (leftName !== null && rightName !== null) {
      const nameOrder = collator.compare(leftName, rightName);
      if (nameOrder !== 0) return nameOrder;
    }
    return compareIds(left.id, right.id);
  };

  return PRESENCE_ORDER.map(presence => ({
    presence,
    identities: identities.filter(identity => identity.presence === presence).sort(compare),
  })).filter(group => group.identities.length > 0);
}

function normalizedName(displayName: string | null): string | null {
  const normalized = displayName?.trim();
  return normalized ? normalized : null;
}

function compareIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
