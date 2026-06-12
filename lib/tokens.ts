// Rough estimate: ~4 chars per token for English text.
// The extension keeps its own copy in extension/content.js — it runs as a
// plain content script and can't import from the Next.js app.
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
