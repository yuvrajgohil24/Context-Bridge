// Client-side history of past compressions, persisted in localStorage.
// Kept on the client so the app stays deployable with zero database setup.

import { estimateTokens } from "./tokens";

const STORAGE_KEY = "contextbridge:history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  title: string;
  source: string; // e.g. "playground", "claude.ai"
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  createdAt: number;
}

function deriveTitle(compressed: string): string {
  // Use the first meaningful line of the summary as a label.
  const firstLine = compressed
    .split("\n")
    .map((l) => l.replace(/[*#\-\s]+/g, " ").trim())
    .find((l) => l.length > 3);
  const text = firstLine || "Untitled context";
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(params: {
  original: string;
  compressed: string;
  source?: string;
}): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    title: deriveTitle(params.compressed),
    source: params.source || "playground",
    original: params.original,
    compressed: params.compressed,
    originalTokens: estimateTokens(params.original),
    compressedTokens: estimateTokens(params.compressed),
    createdAt: Date.now(),
  };

  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — fail silently; history is best-effort.
  }
  return entry;
}

export function deleteEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Reduction percentage, clamped to [0, 100].
export function reductionPercent(originalTokens: number, compressedTokens: number): number {
  if (!originalTokens) return 0;
  const pct = (1 - compressedTokens / originalTokens) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
