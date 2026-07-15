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

export async function fetchTetis(): Promise<TetiRecord[] | null> {
  try {
    const response = await fetch(`/api/tetis?fresh=${Date.now()}`, {
      cache: 'no-store',
      headers: {'cache-control': 'no-cache'},
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {tetis?: TetiRecord[]};
    return Array.isArray(data.tetis) ? data.tetis : null;
  } catch {
    return null;
  }
}
