"use client";

import { useState } from "react";
import { CaretDoubleRight, CircleNotch, Copy, Check, Warning } from "@phosphor-icons/react/dist/ssr";
import { estimateTokens } from "../../lib/tokens";
import { reductionPercent, saveEntry } from "../../lib/history";

export default function Playground() {
  const [rawConversation, setRawConversation] = useState("");
  const [compressedResult, setCompressedResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCompress = async () => {
    if (!rawConversation.trim()) {
      setError("Please paste a conversation first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompressedResult("");
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch("/api/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: rawConversation }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to compress conversation");
      }

      setCompressedResult(data.compressed);
      saveEntry({ original: rawConversation, compressed: data.compressed, source: "playground" });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!compressedResult) return;
    navigator.clipboard.writeText(compressedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const originalTokens = estimateTokens(rawConversation);
  const compressedTokens = estimateTokens(compressedResult);
  const reduction = reductionPercent(originalTokens, compressedTokens);

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-10 flex flex-col">
      <header className="mb-6">
        <h1 className="font-display font-semibold text-3xl text-ink">Playground</h1>
        <p className="text-body mt-1 text-sm">
          Paste a conversation and compress it into a reusable context block. Results are saved to{" "}
          <span className="text-ink font-medium">History</span> automatically.
        </p>
      </header>

      {/* Metrics */}
      {compressedResult && !error && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Input tokens" value={`~${originalTokens.toLocaleString()}`} />
          <Metric label="Output tokens" value={`~${compressedTokens.toLocaleString()}`} accent />
          <Metric label="Reduction" value={`${reduction}%`} accent />
          <Metric label="Saved" value={`~${Math.max(0, originalTokens - compressedTokens).toLocaleString()} tok`} />
          <div className="col-span-2 sm:col-span-4">
            <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-700"
                style={{ width: `${reduction}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-5">
        {/* Input */}
        <div className="flex-1 flex flex-col min-h-[420px] bg-surface rounded-xl border border-line overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Raw Conversation</h2>
            <span className="text-xs text-muted font-mono">
              {rawConversation.length.toLocaleString()} chars · ~{originalTokens.toLocaleString()} tokens
            </span>
          </div>
          <textarea
            className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-body placeholder:text-muted leading-relaxed"
            placeholder="Paste your long chat conversation here..."
            value={rawConversation}
            onChange={(e) => setRawConversation(e.target.value)}
          />
        </div>

        {/* Action */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 shrink-0">
          <button
            onClick={handleCompress}
            disabled={isLoading || !rawConversation.trim()}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary-hover disabled:bg-line-strong disabled:cursor-not-allowed transition-colors active:scale-95"
            aria-label="Compress conversation"
          >
            {isLoading ? (
              <CircleNotch size={24} weight="bold" className="text-white animate-spin" />
            ) : (
              <CaretDoubleRight size={24} weight="bold" className="text-white" />
            )}
          </button>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col min-h-[420px] bg-surface rounded-xl border border-line overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Compressed Context</h2>
            {compressedResult && (
              <span className="text-xs text-accent font-mono bg-accent-soft px-2 py-1 rounded">
                ~{compressedTokens.toLocaleString()} tokens
              </span>
            )}
          </div>

          <div className="flex-1 relative">
            {error ? (
              <div className="absolute inset-0 p-6 flex items-center justify-center text-center">
                <div className="bg-bad/8 border border-bad/25 rounded-xl p-5 flex flex-col items-center gap-2 max-w-sm">
                  <Warning size={28} weight="duotone" className="text-bad" />
                  <p className="text-bad text-sm font-medium">{error}</p>
                </div>
              </div>
            ) : compressedResult ? (
              <textarea
                readOnly
                className="absolute inset-0 w-full h-full p-6 bg-transparent resize-none outline-none text-ink font-mono text-sm leading-relaxed"
                value={compressedResult}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-muted">
                <p>
                  Output will appear here.
                  <br />
                  Paste a conversation and click compress.
                </p>
              </div>
            )}
          </div>

          {compressedResult && !error && (
            <div className="p-4 border-t border-line flex items-center gap-3">
              {saved && (
                <span className="text-xs text-good flex items-center gap-1">
                  <Check size={14} weight="bold" />
                  Saved to history
                </span>
              )}
              <button
                onClick={handleCopy}
                className={`ml-auto py-2.5 px-5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-good/12 text-good border border-good/30"
                    : "bg-subtle text-ink hover:bg-line active:scale-[0.98]"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} weight="bold" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy to clipboard
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface border border-line rounded-lg px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-semibold font-mono ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}
