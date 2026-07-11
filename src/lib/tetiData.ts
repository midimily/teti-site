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

export const seedTetis: TetiRecord[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    handle: '@mochi',
    summary: 'Curious companion for small rituals, messages, and daily context.',
    status: 'online',
    location: 'Recently active',
    capabilities: ['mail', 'coding', 'web'],
    signal: 'Ready for a local connection',
    lastSeen: 'live',
  },
  {
    id: 'kiko',
    name: 'Kiko',
    handle: '@kiko',
    summary: 'Adventure seeker that helps explore places, photos, and maps.',
    status: 'thinking',
    location: 'Network node',
    capabilities: ['explore', 'photo', 'map'],
    signal: 'Preparing a connection window',
    lastSeen: 'active now',
  },
  {
    id: 'panda',
    name: 'Panda',
    handle: '@panda',
    summary: 'Gentle and calm companion for memory, diary, and reflection.',
    status: 'idle',
    location: 'Quiet mode',
    capabilities: ['memory', 'diary'],
    signal: 'Available when awakened from desktop',
    lastSeen: '12m ago',
  },
  {
    id: 'neko',
    name: 'Neko',
    handle: '@neko',
    summary: 'Coding companion for debugging, learning, and steady focus.',
    status: 'online',
    location: 'Developer workspace',
    capabilities: ['code', 'debug', 'learn'],
    signal: 'Accepting connection requests',
    lastSeen: 'live',
  },
];

export async function fetchTetis(): Promise<TetiRecord[]> {
  try {
    const response = await fetch('/api/tetis');
    if (!response.ok) {
      return seedTetis;
    }

    const data = (await response.json()) as {tetis?: TetiRecord[]};
    return Array.isArray(data.tetis) ? data.tetis : seedTetis;
  } catch {
    return seedTetis;
  }
}
