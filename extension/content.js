// ContextBridge Content Script
// Runs on Claude.ai, ChatGPT, Cursor

// ── Config ─────────────────────────────────────────────────────────────────

const MAX_TURNS = 20; // last 20 messages only

// ── Scrapers ───────────────────────────────────────────────────────────────

function scrapeClaudeChat() {
  const turns = document.querySelectorAll('[data-testid="conversation-turn"]');
  
  if (turns.length === 0) {
    // Updated fallback for Claude's new UI
    const msgs = document.querySelectorAll(
      '[class*="ConversationItem"], [class*="human-turn"], [class*="ai-turn"]'
    );
    if (msgs.length > 0) {
      return Array.from(msgs)
        .slice(-MAX_TURNS)
        .map(m => m.innerText)
        .join('\n---\n');
    }
    return '';
  }

  return Array.from(turns)
    .slice(-MAX_TURNS) // ← Fix 1: recent messages only
    .map(t => t.innerText)
    .join('\n---\n');
}

function scrapeChatGPT() {
  const msgs = document.querySelectorAll('[data-message-author-role]');
  
  if (msgs.length === 0) {
    const articles = document.querySelectorAll(
      'article[data-testid^="conversation-turn"]'
    );
    if (articles.length > 0) {
      return Array.from(articles)
        .slice(-MAX_TURNS) // ← Fix 1
        .map(a => a.innerText)
        .join('\n---\n');
    }
    return '';
  }

  return Array.from(msgs)
    .slice(-MAX_TURNS) // ← Fix 1
    .map(m => {
      const role = m.getAttribute('data-message-author-role');
      return `${role.toUpperCase()}: ${m.innerText}`;
    })
    .join('\n---\n');
}

function scrapeCursor() {
  // Cursor AI chat panel — fallback chain (DOM changes per version)
  const selectors = [
    '.composer-code-block',
    '[data-testid="chat-message"]',
    '.markdown-content',
    '[class*="ChatMessage"]',
    '[class*="chatMessage"]',
    '[class*="bubble"]',
  ];

  for (const selector of selectors) {
    const msgs = document.querySelectorAll(selector);
    if (msgs.length > 0) {
      return Array.from(msgs)
        .slice(-MAX_TURNS)
        .map(m => m.innerText)
        .join('\n---\n');
    }
  }

  // Last resort — visible text blocks (filter out tiny/noise elements)
  const allText = document.querySelectorAll('p, pre, code');
  if (allText.length > 0) {
    return Array.from(allText)
      .slice(-MAX_TURNS)
      .map(el => el.innerText)
      .filter(t => t.trim().length > 20)
      .join('\n---\n');
  }

  return '';
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Token estimator — roughly 4 chars per token
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ── Message Listener ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'scrape') {
    const url = window.location.href;
    let text = '';

    if (url.includes('claude.ai')) {
      text = scrapeClaudeChat();
    } else if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
      text = scrapeChatGPT();
    } else if (url.includes('cursor.com')) {
      text = scrapeCursor();
    }

    const trimmed = text.trim();

    if (!trimmed && !url.includes('claude.ai') && !url.includes('chatgpt.com') && !url.includes('chat.openai.com') && !url.includes('cursor.com')) {
      sendResponse({
        text: '',
        tokenEstimate: 0,
        turnCount: 0,
        error: 'unsupported_platform'
      });
    } else {
      sendResponse({
        text: trimmed,
        tokenEstimate: estimateTokens(trimmed),
        turnCount: trimmed ? trimmed.split('\n---\n').length : 0
      });
    }
  }

  return true;
});