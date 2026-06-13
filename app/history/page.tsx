"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Copy, Check, Trash, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import {
  HistoryEntry,
  loadHistory,
  deleteEntry,
  clearHistory,
  reductionPercent,
} from "../../lib/history";

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [active, setActive] = useState<HistoryEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage is client-only, so we must read it after mount to avoid a
    // hydration mismatch — this is the intended use of setState in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadHistory());
    setMounted(true);
  }, []);

  const handleDelete = (id: string) => {
    const next = deleteEntry(id);
    setEntries(next);
    if (active?.id === id) setActive(null);
  };

  const handleClear = () => {
    clearHistory();
    setEntries([]);
    setActive(null);
  };

  const handleCopy = (entry: HistoryEntry) => {
    navigator.clipboard.writeText(entry.compressed);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl text-ink">History</h1>
          <p className="text-body mt-1 text-sm">
            Your compressed context blocks, stored locally in this browser.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-muted hover:text-bad transition-colors px-3 py-1.5 rounded-lg hover:bg-bad/8"
          >
            Clear all
          </button>
        )}
      </header>

      {!mounted ? null : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-line-strong rounded-2xl bg-subtle">
          <ClockCounterClockwise size={44} weight="duotone" className="text-line-strong mb-4" />
          <p className="text-ink font-medium mb-1">No compressions yet</p>
          <p className="text-muted text-sm mb-6">Your saved context blocks will appear here.</p>
          <Link
            href="/playground"
            className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            Go to playground
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => {
            const reduction = reductionPercent(entry.originalTokens, entry.compressedTokens);
            const open = active?.id === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-surface border border-line rounded-xl p-5 hover:border-line-strong transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-ink font-medium truncate">{entry.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted">
                      <span className="px-2 py-0.5 rounded bg-subtle text-body font-medium">{entry.source}</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      <span className="text-accent font-mono">
                        ~{entry.originalTokens.toLocaleString()} → ~{entry.compressedTokens.toLocaleString()} tok
                      </span>
                      <span className="text-good font-medium">{reduction}% smaller</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setActive(open ? null : entry)}
                      className="p-2 rounded-lg text-muted hover:text-ink hover:bg-subtle transition-colors"
                      title={open ? "Hide" : "View"}
                    >
                      <Eye size={18} weight={open ? "fill" : "regular"} />
                    </button>
                    <button
                      onClick={() => handleCopy(entry)}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedId === entry.id ? "text-good bg-good/12" : "text-muted hover:text-ink hover:bg-subtle"
                      }`}
                      title="Copy"
                    >
                      {copiedId === entry.id ? <Check size={18} weight="bold" /> : <Copy size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-lg text-muted hover:text-bad hover:bg-bad/8 transition-colors"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                {open && (
                  <pre className="mt-4 p-4 rounded-lg bg-subtle border border-line text-body text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {entry.compressed}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
