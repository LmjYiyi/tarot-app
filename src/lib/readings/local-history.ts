const STORAGE_KEY = "arcana-flow:reading-history";
const MAX_ENTRIES = 60;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

export type LocalReadingEntry = {
  shareToken: string;
  spreadSlug: string;
  spreadName: string;
  question: string;
  cardCount: number;
  reversedCount: number;
  intentLabel?: string | null;
  createdAt: string;
};

const EMPTY_SNAPSHOT: LocalReadingEntry[] = Object.freeze([]) as unknown as LocalReadingEntry[];

let cachedSnapshot: LocalReadingEntry[] | null = null;
const listeners = new Set<() => void>();
let storageListenerAttached = false;

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidEntry(value: unknown): value is LocalReadingEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.shareToken === "string" &&
    typeof entry.spreadSlug === "string" &&
    typeof entry.spreadName === "string" &&
    typeof entry.createdAt === "string"
  );
}

function readRaw(): LocalReadingEntry[] {
  if (!isStorageAvailable()) return EMPTY_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_SNAPSHOT;
    return parsed.filter(isValidEntry);
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeRaw(entries: LocalReadingEntry[]) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // 配额或隐私模式下静默失败，不影响主流程
  }
}

function invalidateAndNotify() {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function ensureStorageListener() {
  if (storageListenerAttached) return;
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    invalidateAndNotify();
  });
  storageListenerAttached = true;
}

export function subscribeLocalReadings(listener: () => void): () => void {
  ensureStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLocalReadingsSnapshot(): LocalReadingEntry[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readRaw();
  }
  return cachedSnapshot;
}

export function getLocalReadingsServerSnapshot(): LocalReadingEntry[] {
  return EMPTY_SNAPSHOT;
}

export function addLocalReading(entry: LocalReadingEntry) {
  if (!isStorageAvailable()) return;
  const filtered = readRaw().filter((item) => item.shareToken !== entry.shareToken);
  writeRaw([entry, ...filtered].slice(0, MAX_ENTRIES));
  invalidateAndNotify();
}

export function removeLocalReading(shareToken: string) {
  if (!isStorageAvailable()) return;
  writeRaw(readRaw().filter((item) => item.shareToken !== shareToken));
  invalidateAndNotify();
}

export function clearLocalReadings() {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
  invalidateAndNotify();
}

export function extractTokenFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (TOKEN_PATTERN.test(trimmed)) return trimmed;

  const match = trimmed.match(/\/r\/([A-Za-z0-9_-]+)/);
  if (match && TOKEN_PATTERN.test(match[1])) return match[1];

  const tail = trimmed.split(/[\\/?#]/).filter(Boolean).pop();
  if (tail && TOKEN_PATTERN.test(tail)) return tail;

  return null;
}
