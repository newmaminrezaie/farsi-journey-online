// Thin localStorage-backed key/value store.
// The API layer wraps this so a real HTTP backend can replace it later.

const PREFIX = "higooya:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(PREFIX + key);
  },
};

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function refCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `HG-${n}`;
}
