// ContextBridge Popup Script
const API_BASE = 'http://localhost:3000';

// ── DOM refs ────────────────────────────────────────────────────────────────
const statusDot    = document.getElementById('status-dot');
const statusText   = document.getElementById('status-text');
const pageHost     = document.getElementById('page-host');
const previewBox   = document.getElementById('preview-box');
const charCount    = document.getElementById('char-count');
const compressBtn  = document.getElementById('compress-btn');
const copyBtn      = document.getElementById('copy-btn');
const outputBox    = document.getElementById('output-box');
const outputLabel  = document.getElementById('output-label');
const tokenBadge   = document.getElementById('token-badge');
const errorMsg     = document.getElementById('error-msg');

let scrapedText  = '';
let compressed   = '';

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

// ── On Load: scrape current tab ──────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab || !tab.id) {
    setStatus('error', 'No active tab found');
    return;
  }

  // Show hostname
  try {
    const url = new URL(tab.url);
    pageHost.textContent = url.hostname;
  } catch (_) {
    pageHost.textContent = '—';
  }

  // Check if this is a supported site
  const supportedHosts = ['claude.ai', 'chatgpt.com', 'chat.openai.com', 'cursor.com'];
  const isSupportedSite = supportedHosts.some(h => tab.url && tab.url.includes(h));

  if (!isSupportedSite) {
    setStatus('error', 'Not a supported AI chat page');
    previewBox.textContent = 'Open Claude, ChatGPT, or Cursor to scrape.';
    return;
  }

  setStatus('', 'Scraping conversation...');

  chrome.tabs.sendMessage(tab.id, { action: 'scrape' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('error', 'Cannot reach page');
      showError('Could not inject into page. Try reloading the chat page.');
      return;
    }

    if (!response || !response.text || response.text.length === 0) {
      setStatus('error', 'Nothing found on page');
      previewBox.textContent = 'No conversation detected. Make sure a chat is open.';
      return;
    }

    scrapedText = response.text;
    setStatus('active', 'Conversation scraped ✓');
    previewBox.textContent = scrapedText.slice(0, 200) + (scrapedText.length > 200 ? '…' : '');
    charCount.textContent = scrapedText.length.toLocaleString();
    compressBtn.disabled = false;
    hideError();
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
    const res = await fetch(`${API_BASE}/api/compress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: scrapedText }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }

    compressed = data.compressed;

    outputBox.textContent  = compressed;
    outputLabel.style.display = 'block';
    outputBox.style.display   = 'block';
    copyBtn.disabled          = false;
    tokenBadge.style.display  = 'block';
    tokenBadge.textContent    = `~${estimateTokens(compressed)} tokens`;

  } catch (err) {
    showError(err.message || 'Failed to compress. Is the web app running?');
    compressBtn.disabled = false;
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
