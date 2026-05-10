type Entry<T> = {
  expiresAt: number;
  value: T;
};

const memory = new Map<string, Entry<unknown>>();

export function getCached<T>(key: string): T | null {
  const row = memory.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function deleteCached(key: string) {
  memory.delete(key);
}
