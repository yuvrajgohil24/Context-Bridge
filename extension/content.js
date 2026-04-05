// ContextBridge Content Script
// Runs on Claude.ai, ChatGPT, Cursor

// ── Scrapers ───────────────────────────────────────────────────────────────

function scrapeClaudeChat() {
  const turns = document.querySelectorAll('[data-testid="conversation-turn"]');
  if (turns.length === 0) {
    // fallback: prose containers
    const msgs = document.querySelectorAll('.font-claude-message, .whitespace-pre-wrap');
    if (msgs.length > 0) {
      return Array.from(msgs).map(m => m.innerText).join('\n---\n');
    }
    return '';
  }
  return Array.from(turns).map(t => t.innerText).join('\n---\n');
}

function scrapeChatGPT() {
  const msgs = document.querySelectorAll('[data-message-author-role]');
  if (msgs.length === 0) {
    // fallback selectors
    const articles = document.querySelectorAll('article[data-testid^="conversation-turn"]');
    if (articles.length > 0) {
      return Array.from(articles).map(a => a.innerText).join('\n---\n');
    }
    return '';
  }
  return Array.from(msgs).map(m => {
    const role = m.getAttribute('data-message-author-role');
    return `${role.toUpperCase()}: ${m.innerText}`;
  }).join('\n---\n');
}

function scrapeCursor() {
  // Cursor uses a similar layout to VS Code webviews
  const msgs = document.querySelectorAll('.chat-message, .message-content, [class*="message"]');
  return Array.from(msgs).map(m => m.innerText).join('\n---\n');
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

    sendResponse({ text: text.trim() });
  }
  return true; // keep message channel open for async
});
