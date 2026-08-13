export const TETI_ID_PATTERN = /^teti_[a-z0-9]{9}$/;

export type PublicPresence = 'available' | 'unavailable';

export type NetworkPublicIdentity = {
  tetiId: string;
  displayName: string | null;
  summary: string | null;
  presence: PublicPresence;
  capabilityIds: string[];
};

export type NetworkDirectory = {
  items: NetworkPublicIdentity[];
  page: {
    limit: number;
    returnedCount: number;
    nextCursor: string | null;
  };
};

export type NetworkStats = {
  activeIdentityCount: number;
  discoverableNodeCount: number;
  availableNodeCount: number;
  generatedAt: string;
};

export type SiteIdentity = {
  id: string;
  displayName: string | null;
  summary: string | null;
  presence: PublicPresence;
  capabilities: string[];
};

export type SiteNetworkSnapshot = {
  identities: SiteIdentity[];
  page: NetworkDirectory['page'];
  stats: {
    totalTetis: number;
    publicTetis: number;
    availableNow: number;
    generatedAt: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown, maximum: number): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum) {
    throw new Error('Invalid nullable string');
  }
  return value;
}

function nonNegativeInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid non-negative integer');
  }
  return value;
}

function capabilityIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 32) throw new Error('Invalid capability IDs');
  const ids = value.map(item => {
    if (
      typeof item !== 'string' ||
      item.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item)
    ) {
      throw new Error('Invalid capability ID');
    }
    return item;
  });
  const canonical = [...new Set(ids)].sort((left, right) => left.localeCompare(right));
  if (canonical.length !== ids.length || canonical.some((item, index) => item !== ids[index])) {
    throw new Error('Capability IDs are not canonical');
  }
  return ids;
}

export function parsePublicIdentity(value: unknown): NetworkPublicIdentity {
  if (!isRecord(value) || typeof value.tetiId !== 'string' || !TETI_ID_PATTERN.test(value.tetiId)) {
    throw new Error('Invalid public identity');
  }
  if (value.presence !== 'available' && value.presence !== 'unavailable') {
    throw new Error('Invalid public presence');
  }
  return {
    tetiId: value.tetiId,
    displayName: stringOrNull(value.displayName, 80),
    summary: stringOrNull(value.summary, 512),
    presence: value.presence,
    capabilityIds: capabilityIds(value.capabilityIds),
  };
}

export function parseDirectory(value: unknown): NetworkDirectory {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.page)) {
    throw new Error('Invalid public directory');
  }
  const limit = nonNegativeInteger(value.page.limit);
  const returnedCount = nonNegativeInteger(value.page.returnedCount);
  const nextCursor = value.page.nextCursor;
  if (
    limit < 1 ||
    limit > 50 ||
    returnedCount > limit ||
    returnedCount !== value.items.length ||
    (nextCursor !== null &&
      (typeof nextCursor !== 'string' || nextCursor.length < 1 || nextCursor.length > 2048))
  ) {
    throw new Error('Invalid public directory page');
  }
  const items = value.items.map(parsePublicIdentity);
  if (new Set(items.map(identity => identity.tetiId)).size !== items.length) {
    throw new Error('Duplicate public identity');
  }
  for (let index = 1; index < items.length; index += 1) {
    if (items[index - 1].tetiId >= items[index].tetiId) {
      throw new Error('Public directory is not in stable ID order');
    }
  }
  return {items, page: {limit, returnedCount, nextCursor}};
}

export function parseStats(value: unknown): NetworkStats {
  if (!isRecord(value) || typeof value.generatedAt !== 'string') {
    throw new Error('Invalid public stats');
  }
  const activeIdentityCount = nonNegativeInteger(value.activeIdentityCount);
  const discoverableNodeCount = nonNegativeInteger(value.discoverableNodeCount);
  const availableNodeCount = nonNegativeInteger(value.availableNodeCount);
  if (
    availableNodeCount > discoverableNodeCount ||
    discoverableNodeCount > activeIdentityCount ||
    !Number.isFinite(Date.parse(value.generatedAt))
  ) {
    throw new Error('Inconsistent public stats');
  }
  return {
    activeIdentityCount,
    discoverableNodeCount,
    availableNodeCount,
    generatedAt: value.generatedAt,
  };
}

export function toSiteIdentity(identity: NetworkPublicIdentity): SiteIdentity {
  return {
    id: identity.tetiId,
    displayName: identity.displayName,
    summary: identity.summary,
    presence: identity.presence,
    capabilities: identity.capabilityIds,
  };
}

export function toSiteNetworkSnapshot(
  directory: NetworkDirectory,
  stats: NetworkStats,
): SiteNetworkSnapshot {
  return {
    identities: directory.items.map(toSiteIdentity),
    page: directory.page,
    stats: {
      totalTetis: stats.activeIdentityCount,
      publicTetis: stats.discoverableNodeCount,
      availableNow: stats.availableNodeCount,
      generatedAt: stats.generatedAt,
    },
  };
}

export function normalizeTetiId(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return TETI_ID_PATTERN.test(normalized) ? normalized : null;
}
