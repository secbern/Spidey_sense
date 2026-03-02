// Content script
// - Listens for risk updates from background
// - Performs lightweight, on-device content heuristics
// - Renders a senior-friendly banner overlay with traffic-light colors

const BANNER_ID = 'spidey-sense-risk-banner';

const CONTENT_PATTERNS = [
  {
    regex: /gift card|gift-card|prepaid card/i,
    reason: 'content_gift_cards',
    weight: 20
  },
  {
    regex: /wire transfer|western union|moneygram/i,
    reason: 'content_wire_transfer',
    weight: 20
  },
  {
    regex: /remote access|remote control|teamviewer|anydesk|logmein/i,
    reason: 'content_remote_access',
    weight: 25
  },
  {
    regex: /verify your account|confirm your (account|identity)|login to (keep|secure)/i,
    reason: 'content_account_verification',
    weight: 15
  },
  {
    regex: /your account will be (closed|suspended)|immediately suspend/i,
    reason: 'content_urgent_threat',
    weight: 20
  },
  {
    regex: /bitcoin|crypto(?:currency)?/i,
    reason: 'content_crypto',
    weight: 15
  }
];

function getMessage(key) {
  try {
    return chrome.i18n.getMessage(key) || '';
  } catch {
    return '';
  }
}

function ensureBannerContainer() {
  let banner = document.getElementById(BANNER_ID);
  if (banner) return banner;

  banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.tabIndex = -1;

  const inner = document.createElement('div');
  inner.className = 'spidey-banner-inner';

  const icon = document.createElement('div');
  icon.className = 'spidey-banner-icon';

  const text = document.createElement('div');
  text.className = 'spidey-banner-text';

  const buttons = document.createElement('div');
  buttons.className = 'spidey-banner-buttons';

  const leaveBtn = document.createElement('button');
  leaveBtn.className = 'spidey-btn spidey-btn-primary';
  leaveBtn.textContent = getMessage('banner_leave_button') || 'Leave this page';
  leaveBtn.addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : window.close();
  });

  const continueBtn = document.createElement('button');
  continueBtn.className = 'spidey-btn spidey-btn-secondary';
  continueBtn.textContent = getMessage('banner_continue_button') || 'Continue anyway';
  continueBtn.addEventListener('click', () => {
    banner.style.display = 'none';
  });

  const learnMoreBtn = document.createElement('button');
  learnMoreBtn.className = 'spidey-btn spidey-btn-link';
  learnMoreBtn.textContent = getMessage('banner_learn_more_button') || 'Learn more';
  learnMoreBtn.addEventListener('click', () => {
    alert(getMessage('banner_learn_more_text') || 'Be careful with websites asking for money, passwords, or remote access.');
  });

  buttons.appendChild(leaveBtn);
  buttons.appendChild(continueBtn);
  buttons.appendChild(learnMoreBtn);

  inner.appendChild(icon);
  inner.appendChild(text);
  inner.appendChild(buttons);

  banner.appendChild(inner);
  document.documentElement.appendChild(banner);

  return banner;
}

function computeContentSignals() {
  const body = document.body;
  if (!body) return null;

  const text = body.innerText || '';
  if (!text) return null;

  let scoreDelta = 0;
  const reasons = [];

  for (const pattern of CONTENT_PATTERNS) {
    if (pattern.regex.test(text)) {
      scoreDelta += pattern.weight;
      reasons.push(pattern.reason);
    }
  }

  if (scoreDelta <= 0) return null;

  // Cap how much content alone can raise the score.
  scoreDelta = Math.min(scoreDelta, 50);

  return { scoreDelta, reasons };
}

function sendContentSignals() {
  const signals = computeContentSignals();
  if (!signals) return;

  chrome.runtime.sendMessage(
    {
      type: 'CONTENT_SIGNALS',
      payload: signals
    },
    () => {
      // ignore errors
    }
  );
}

function updateBanner(risk) {
  if (!risk || risk.level === 'OFF') {
    const existing = document.getElementById(BANNER_ID);
    if (existing) existing.style.display = 'none';
    return;
  }

  const banner = ensureBannerContainer();
  const inner = banner.querySelector('.spidey-banner-inner');
  const icon = banner.querySelector('.spidey-banner-icon');
  const text = banner.querySelector('.spidey-banner-text');

  let message;
  let levelClass;

  if (risk.level === 'LOW') {
    message = getMessage('banner_safe') || 'Looks OK so far.';
    levelClass = 'spidey-level-low';
  } else if (risk.level === 'MEDIUM') {
    message = getMessage('banner_caution') || 'Please be careful. Something looks unusual.';
    levelClass = 'spidey-level-medium';
  } else {
    message = getMessage('banner_danger') || 'Danger: This may be a scam. We recommend leaving.';
    levelClass = 'spidey-level-high';
  }

  inner.classList.remove('spidey-level-low', 'spidey-level-medium', 'spidey-level-high');
  inner.classList.add(levelClass);

  icon.textContent = risk.level === 'LOW' ? '🛡️' : risk.level === 'MEDIUM' ? '⚠️' : '⛔';
  text.textContent = message;

  banner.style.display = 'block';
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'RISK_UPDATE') {
    updateBanner(message.payload?.risk);
  }
});

// Request current risk on load (handles race when RISK_UPDATE arrived before content script)
chrome.runtime.sendMessage({ type: 'GET_CURRENT_RISK', payload: {} }, (response) => {
  if (response?.ok && response.data?.risk) {
    updateBanner(response.data.risk);
  }
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(sendContentSignals, 2000);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(sendContentSignals, 2000);
  });
}

