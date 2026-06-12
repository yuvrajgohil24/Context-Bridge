// ContextBridge Content Script
// Runs on Claude.ai and ChatGPT (see manifest.json content_scripts matches).

// ── Config ─────────────────────────────────────────────────────────────────

// Instead of a fixed turn count, keep as many recent turns as fit in a
// character budget (~30k tokens at ~4 chars/token). Long conversations keep
// far more context; the server enforces its own hard cap as a backstop.
const MAX_CHARS = 110000;

const TURN_SEPARATOR = '\n---\n';

// ── Helpers ────────────────────────────────────────────────────────────────

// Token estimator — roughly 4 chars per token
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Walk turns from newest to oldest, keeping whole turns until the character
// budget is spent. Returns { text, includedTurns, totalTurns }.
function joinWithinBudget(turns, maxChars) {
  const kept = [];
  let used = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i];
    const cost = turn.length + TURN_SEPARATOR.length;
    if (kept.length > 0 && used + cost > maxChars) break;
    kept.unshift(turn);
    used += cost;
  }
  return {
    text: kept.join(TURN_SEPARATOR),
    includedTurns: kept.length,
    totalTurns: turns.length,
  };
}

// ── Scrapers ───────────────────────────────────────────────────────────────
// Each scraper returns an array of turn strings (oldest first), with a
// ROLE: prefix when the DOM exposes one. Selectors are best-effort and
// verified by fixture tests in tests/scrapers.test.js.

function scrapeClaudeChat(doc) {
  const turns = doc.querySelectorAll('[data-testid="conversation-turn"]');
  if (turns.length > 0) {
    return Array.from(turns).map((t) => {
      // Claude marks user messages; anything else in a turn is the assistant.
      const isHuman = t.querySelector('[data-testid="user-message"]') !== null;
      return `${isHuman ? 'HUMAN' : 'ASSISTANT'}: ${t.innerText}`;
    });
  }

  // Fallback for UI variants that don't use conversation-turn testids.
  const msgs = doc.querySelectorAll(
    '[data-testid="user-message"], [class*="ConversationItem"], [class*="human-turn"], [class*="ai-turn"]'
  );
  return Array.from(msgs).map((m) => m.innerText);
}

function scrapeChatGPT(doc) {
  const msgs = doc.querySelectorAll('[data-message-author-role]');
  if (msgs.length > 0) {
    return Array.from(msgs).map((m) => {
      const role = m.getAttribute('data-message-author-role');
      return `${role.toUpperCase()}: ${m.innerText}`;
    });
  }

  const articles = doc.querySelectorAll('article[data-testid^="conversation-turn"]');
  return Array.from(articles).map((a) => a.innerText);
}

function scrapeConversation(url, doc) {
  if (url.includes('claude.ai')) return scrapeClaudeChat(doc);
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return scrapeChatGPT(doc);
  return [];
}

// ── Message Listener ───────────────────────────────────────────────────────

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'scrape') {
      const turns = scrapeConversation(window.location.href, document)
        .map((t) => t.trim())
        .filter(Boolean);
      const { text, includedTurns, totalTurns } = joinWithinBudget(turns, MAX_CHARS);

      sendResponse({
        text,
        tokenEstimate: estimateTokens(text),
        turnCount: includedTurns,
        totalTurns,
      });
    }
  });
}

// Exported for unit tests (ignored by Chrome, which loads this as a plain script).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    estimateTokens,
    joinWithinBudget,
    scrapeClaudeChat,
    scrapeChatGPT,
    scrapeConversation,
    MAX_CHARS,
  };
}
