"use client";

import { useState } from "react";

export default function Home() {
  const [rawConversation, setRawConversation] = useState("");
  const [compressedResult, setCompressedResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCompress = async () => {
    if (!rawConversation.trim()) {
      setError("Please paste a conversation first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompressedResult("");
    setCopied(false);

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
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
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

  // Rough estimate: ~4 chars per token for English text
  const getEstimatedTokens = (text: string) => {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-6 lg:p-12 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="mb-8 select-none">
        <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
          <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          ContextBridge
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">Compress AI chats into instantly reusable context blocks.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative max-w-7xl mx-auto w-full">
        
        {/* Left Side: Input */}
        <div className="flex-1 flex flex-col min-h-[400px] bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:border-zinc-700/50">
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Raw Conversation</h2>
            <span className="text-xs text-zinc-500 font-mono">{rawConversation.length} chars</span>
          </div>
          <textarea
            className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-zinc-300 placeholder:text-zinc-600 focus:ring-0 leading-relaxed"
            placeholder="Paste your long chat conversation here..."
            value={rawConversation}
            onChange={(e) => setRawConversation(e.target.value)}
          />
        </div>

        {/* Center: Action Button */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 py-4 lg:py-0 shrink-0 select-none z-10">
          <button
            onClick={handleCompress}
            disabled={isLoading || !rawConversation.trim()}
            className="group relative flex items-center justify-center p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95"
            aria-label="Compress Conversation"
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 flex flex-col min-h-[400px] bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:border-zinc-700/50">
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/80 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Compressed Context</h2>
            {compressedResult && (
              <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-md">
                ~{getEstimatedTokens(compressedResult)} tokens
              </span>
            )}
          </div>
          
          <div className="flex-1 relative">
            {error ? (
              <div className="absolute inset-0 p-6 flex items-center justify-center text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center gap-2 max-w-sm">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              </div>
            ) : compressedResult ? (
              <div className="absolute inset-0">
                <textarea
                  readOnly
                  className="w-full h-full p-6 bg-transparent resize-none outline-none text-zinc-200 font-mono text-sm leading-relaxed"
                  value={compressedResult}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-zinc-600">
                <p>Output will appear here.<br/>Paste a conversation and click compress.</p>
              </div>
            )}
          </div>
          
          {compressedResult && !error && (
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 mt-auto">
              <button
                onClick={handleCopy}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy to Clipboard
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
