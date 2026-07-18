export type TetiStatus = 'online' | 'thinking' | 'idle' | 'offline';

export type TetiRecord = {
  id: string;
  name: string;
  handle: string;
  summary: string;
  status: TetiStatus;
  location: string;
  capabilities: string[];
  signal: string;
  lastSeen: string;
};

export type RegistryStats = {
  registryCount: number | null;
  activeCount: number;
  recentCount: number | null;
};

export async function fetchTetis(): Promise<TetiRecord[] | null> {
  try {
    const response = await fetch('/api/tetis');
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {tetis?: TetiRecord[]};
    return Array.isArray(data.tetis) ? data.tetis : null;
  } catch {
    return null;
  }
}

export async function fetchStats(): Promise<RegistryStats | null> {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as Partial<RegistryStats>;
    return (typeof data.registryCount === 'number' || data.registryCount === null) &&
      typeof data.activeCount === 'number' &&
      (typeof data.recentCount === 'number' || data.recentCount === null)
      ? {
          registryCount: data.registryCount,
          activeCount: data.activeCount,
          recentCount: data.recentCount,
        }
      : null;
  } catch {
    return null;
  }
}
