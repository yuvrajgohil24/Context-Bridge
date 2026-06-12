// ContextBridge Popup Script
const DEFAULT_API_BASE = 'http://localhost:3000';

// ── DOM refs ────────────────────────────────────────────────────────────────
const statusDot     = document.getElementById('status-dot');
const statusText    = document.getElementById('status-text');
const pageHost      = document.getElementById('page-host');
const previewBox    = document.getElementById('preview-box');
const scrapedTurns  = document.getElementById('scraped-turns');
const scrapedTokens = document.getElementById('scraped-tokens');
const charCount     = document.getElementById('char-count');
const compressBtn   = document.getElementById('compress-btn');
const copyBtn       = document.getElementById('copy-btn');
const outputBox     = document.getElementById('output-box');
const outputLabel   = document.getElementById('output-label');
const tokenBadge    = document.getElementById('token-badge');
const errorMsg      = document.getElementById('error-msg');
const settingsToggle = document.getElementById('settings-toggle');
const settingsRow   = document.getElementById('settings-row');
const apiBaseInput  = document.getElementById('api-base-input');
const apiBaseSave   = document.getElementById('api-base-save');

let scrapedText = '';
let compressed  = '';
let currentTabUrl = '';
let apiBase = DEFAULT_API_BASE;

// ── Helpers ─────────────────────────────────────────────────────────────────
function setStatus(type, text) {
  statusDot.className  = type; // '', 'active', 'error'
  statusText.textContent = text;
}

function showError(msg) {
  errorMsg.style.display = 'block';
  errorMsg.textContent   = msg;
}

function hideError() {
  errorMsg.style.display = 'none';
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function showCompressed(text) {
  compressed = text;
  outputBox.textContent     = text;
  outputLabel.style.display = 'block';
  outputBox.style.display   = 'block';
  copyBtn.disabled          = false;
  tokenBadge.style.display  = 'block';
  tokenBadge.textContent    = `~${estimateTokens(text)} tokens`;
}

// Persist the last result per conversation URL so closing the popup
// doesn't lose work. Keeps only the most recent 20 entries.
function saveResult(url, text) {
  chrome.storage.local.get({ results: {} }, ({ results }) => {
    results[url] = { compressed: text, ts: Date.now() };
    const entries = Object.entries(results)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 20);
    chrome.storage.local.set({ results: Object.fromEntries(entries) });
  });
}

function restoreResult(url) {
  chrome.storage.local.get({ results: {} }, ({ results }) => {
    if (results[url]) showCompressed(results[url].compressed);
  });
}

// ── Settings: configurable API base ─────────────────────────────────────────
chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE }, (cfg) => {
  apiBase = cfg.apiBase;
  apiBaseInput.value = apiBase;
});

settingsToggle.addEventListener('click', () => {
  settingsRow.style.display = settingsRow.style.display === 'flex' ? 'none' : 'flex';
});

apiBaseSave.addEventListener('click', () => {
  let value = apiBaseInput.value.trim().replace(/\/+$/, '') || DEFAULT_API_BASE;
  let origin;
  try {
    origin = new URL(value).origin;
  } catch {
    showError('Invalid API URL.');
    return;
  }

  const persist = () => {
    apiBase = origin;
    apiBaseInput.value = origin;
    chrome.storage.sync.set({ apiBase: origin });
    hideError();
    settingsRow.style.display = 'none';
  };

  if (origin.startsWith('http://localhost')) {
    persist();
    return;
  }

  // Non-localhost endpoints need a runtime host permission grant.
  chrome.permissions.request({ origins: [origin + '/*'] }, (granted) => {
    if (granted) persist();
    else showError('Permission for that host was not granted.');
  });
});

// ── On Load: scrape current tab ──────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab || !tab.id) {
    setStatus('error', 'No active tab found');
    return;
  }

  currentTabUrl = tab.url || '';

  // Show hostname
  try {
    const url = new URL(tab.url);
    pageHost.textContent = url.hostname;
  } catch {
    pageHost.textContent = '—';
  }

  setStatus('', 'Scraping conversation...');

  chrome.tabs.sendMessage(tab.id, { action: 'scrape' }, (response) => {
    if (chrome.runtime.lastError) {
      // The content script only exists on supported chat sites, so this is
      // either an unsupported page or a stale tab that needs a reload.
      setStatus('error', 'Unsupported page');
      previewBox.textContent =
        'Open a conversation on claude.ai or chatgpt.com. If you are on one, reload the page and try again.';
      restoreResult(currentTabUrl);
      return;
    }

    if (!response || !response.text || response.text.length === 0) {
      setStatus('error', 'Nothing found on page');
      previewBox.textContent = 'No conversation detected. Make sure a chat is open.';
      restoreResult(currentTabUrl);
      return;
    }

    scrapedText = response.text;
    setStatus('active', 'Conversation scraped ✓');
    previewBox.textContent = scrapedText.slice(0, 200) + (scrapedText.length > 200 ? '…' : '');

    charCount.textContent = scrapedText.length.toLocaleString();

    if (response.turnCount) {
      const total = response.totalTurns || response.turnCount;
      scrapedTurns.textContent = total > response.turnCount
        ? `${response.turnCount} of ${total} turns`
        : `${response.turnCount} turns`;
      scrapedTurns.style.display = 'block';
    }

    if (response.tokenEstimate) {
      scrapedTokens.textContent = `~${response.tokenEstimate} tokens`;
      scrapedTokens.style.display = 'block';
    }

    compressBtn.disabled = false;
    hideError();
    restoreResult(currentTabUrl);
  });
});

// ── Compress ─────────────────────────────────────────────────────────────────
compressBtn.addEventListener('click', async () => {
  if (!scrapedText) return;

  hideError();
  compressBtn.disabled = true;
  compressBtn.innerHTML = '<div class="spinner"></div> Compressing…';
  outputBox.style.display    = 'none';
  outputLabel.style.display  = 'none';
  tokenBadge.style.display   = 'none';
  copyBtn.disabled           = true;

  try {
    const res = await fetch(`${apiBase}/api/compress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: scrapedText }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }

    showCompressed(data.compressed);
    saveResult(currentTabUrl, data.compressed);

  } catch (err) {
    showError(err.message || 'Failed to compress. Is the web app running?');
  } finally {
    compressBtn.innerHTML = `
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      Compress`;
    compressBtn.disabled = false;
  }
});

// ── Copy ─────────────────────────────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  if (!compressed) return;

  navigator.clipboard.writeText(compressed).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>`;

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"/>
        </svg>`;
    }, 2000);
  });
});
