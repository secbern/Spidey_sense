// Background service worker (Manifest V3)
// - Monitors tab navigation
// - Runs local URL risk heuristics
// - Caches scores and notifies content scripts & popup

import { evaluateUrlRisk } from './detector.js';

// Simple in-memory cache keyed by tabId
// Each entry: { url, urlRisk, contentSignals, risk }
const tabRiskCache = new Map();

// User preferences stored in chrome.storage.sync
const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 'balanced', // 'conservative' | 'balanced' | 'strict'
  language: 'en',
  advancedProtectionEnabled: false,
  userAllowlist: [],
  userBlocklist: []
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve(items);
    });
  });
}

async function setSettings(partial) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(partial, () => resolve());
  });
}

function computeCombinedRisk(urlRisk, contentSignals) {
  if (!urlRisk || urlRisk.level === 'OFF') {
    return urlRisk;
  }

  let score = typeof urlRisk.score === 'number' ? urlRisk.score : 0;
  const reasons = Array.isArray(urlRisk.reasons) ? [...urlRisk.reasons] : [];

  if (contentSignals && typeof contentSignals.scoreDelta === 'number') {
    score += contentSignals.scoreDelta;
    if (Array.isArray(contentSignals.reasons)) {
      reasons.push(...contentSignals.reasons);
    }
  }

  score = Math.max(0, Math.min(100, score));

  let level = 'LOW';
  if (score >= 70) {
    level = 'HIGH';
  } else if (score >= 35) {
    level = 'MEDIUM';
  }

  return {
    level,
    score,
    reasons
  };
}

function parseDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function addToUserAllowlist(tabId) {
  const cached = tabRiskCache.get(tabId);
  const url = cached?.url;
  if (!url) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab?.url) {
        const domain = parseDomain(tab.url);
        if (domain) {
          const settings = await getSettings();
          const list = [...new Set([...(settings.userAllowlist || []), domain])];
          await setSettings({ userAllowlist: list });
          const urlRisk = evaluateUrlRisk(tab.url, { ...settings, userAllowlist: list });
          const existing = tabRiskCache.get(tabId);
          const combined = computeCombinedRisk(urlRisk, existing?.contentSignals);
          cacheAndBroadcastRisk(tabId, tab.url, urlRisk, existing?.contentSignals, combined);
        }
      }
    } catch {
      /* noop */
    }
    return;
  }
  const domain = parseDomain(url);
  if (!domain) return;
  const settings = await getSettings();
  const list = [...new Set([...(settings.userAllowlist || []), domain])];
  await setSettings({ userAllowlist: list });
  const urlRisk = evaluateUrlRisk(url, { ...settings, userAllowlist: list });
  const existing = tabRiskCache.get(tabId);
  const combined = computeCombinedRisk(urlRisk, existing?.contentSignals);
  cacheAndBroadcastRisk(tabId, url, urlRisk, existing?.contentSignals, combined);
}

async function addToUserBlocklist(tabId) {
  const cached = tabRiskCache.get(tabId);
  const url = cached?.url;
  if (!url) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab?.url) {
        const domain = parseDomain(tab.url);
        if (domain) {
          const settings = await getSettings();
          const list = [...new Set([...(settings.userBlocklist || []), domain])];
          await setSettings({ userBlocklist: list });
          const urlRisk = evaluateUrlRisk(tab.url, { ...settings, userBlocklist: list });
          const existing = tabRiskCache.get(tabId);
          const combined = computeCombinedRisk(urlRisk, existing?.contentSignals);
          cacheAndBroadcastRisk(tabId, tab.url, urlRisk, existing?.contentSignals, combined);
        }
      }
    } catch {
      /* noop */
    }
    return;
  }
  const domain = parseDomain(url);
  if (!domain) return;
  const settings = await getSettings();
  const list = [...new Set([...(settings.userBlocklist || []), domain])];
  await setSettings({ userBlocklist: list });
  const urlRisk = evaluateUrlRisk(url, { ...settings, userBlocklist: list });
  const existing = tabRiskCache.get(tabId);
  const combined = computeCombinedRisk(urlRisk, existing?.contentSignals);
  cacheAndBroadcastRisk(tabId, url, urlRisk, existing?.contentSignals, combined);
}

function cacheAndBroadcastRisk(tabId, url, urlRisk, contentSignals, combinedRisk) {
  if (!url) return;

  const risk = combinedRisk || urlRisk;

  tabRiskCache.set(tabId, {
    url,
    urlRisk,
    contentSignals,
    risk
  });

  chrome.tabs.sendMessage(tabId, {
    type: 'RISK_UPDATE',
    payload: {
      url,
      risk
    }
  }, () => {
    // Ignore errors for tabs without content scripts (e.g., chrome:// pages)
    if (chrome.runtime.lastError) {
      // noop
    }
  });
}

async function handleUrlChange(tabId, url) {
  if (!url || !/^https?:/i.test(url)) {
    tabRiskCache.delete(tabId);
    return;
  }

  const settings = await getSettings();
  if (!settings.enabled) {
    const offRisk = {
      level: 'OFF',
      score: 0,
      reasons: ['extension_disabled']
    };
    cacheAndBroadcastRisk(tabId, url, offRisk, null, offRisk);
    return;
  }

  let urlRisk = evaluateUrlRisk(url, settings);

  // Advanced Protection stub (Phase 3 hook point).
  // In the future, when `settings.advancedProtectionEnabled` is true,
  // call a cloud API with minimal, privacy-preserving signals and
  // refine `urlRisk` before combining:
  //
  // urlRisk = await runAdvancedProtectionCheck(url, urlRisk, settings);

  const existing = tabRiskCache.get(tabId);
  const combined = computeCombinedRisk(urlRisk, existing?.contentSignals);

  cacheAndBroadcastRisk(tabId, url, urlRisk, existing?.contentSignals, combined);
}

// Stub for future cloud-based Advanced Protection integration.
// This is intentionally a no-op for now and never sends data off-device.
async function runAdvancedProtectionCheck(url, currentRisk, settings) {
  void url;
  void settings;
  return currentRisk;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handleUrlChange(tabId, tab.url);
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && details.tabId != null && details.url) {
    handleUrlChange(details.tabId, details.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabRiskCache.delete(tabId);
});

// Handle messages from popup, content scripts, options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message || {};

  if (type === 'GET_CURRENT_RISK') {
    const tabId = payload?.tabId ?? sender?.tab?.id;
    if (tabId == null) {
      sendResponse({ ok: false });
      return true;
    }
    const data = tabRiskCache.get(tabId) || null;
    sendResponse({ ok: true, data });
    return true;
  }

  if (type === 'UPDATE_SETTINGS') {
    setSettings(payload || {}).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (type === 'GET_SETTINGS') {
    getSettings().then((settings) => {
      sendResponse({ ok: true, settings });
    });
    return true;
  }

  if (type === 'MARK_SAFE') {
    const tabId = payload?.tabId ?? sender?.tab?.id;
    if (tabId != null) {
      addToUserAllowlist(tabId).then(() => sendResponse({ ok: true }));
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }

  if (type === 'REPORT_SCAM') {
    const tabId = payload?.tabId ?? sender?.tab?.id;
    if (tabId != null) {
      addToUserBlocklist(tabId).then(() => sendResponse({ ok: true }));
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }

  if (type === 'CONTENT_SIGNALS') {
    const tabId = payload?.tabId ?? sender?.tab?.id;
    if (tabId == null) {
      sendResponse({ ok: false });
      return true;
    }

    const scoreDelta =
      typeof payload?.scoreDelta === 'number' ? payload.scoreDelta : 0;
    const reasons = Array.isArray(payload?.reasons) ? payload.reasons : [];

    const existing = tabRiskCache.get(tabId) || {};
    const contentSignals = { scoreDelta, reasons };

    const applyWithUrl = async () => {
      let { url, urlRisk } = existing;

      if (!url) {
        try {
          const tab = await chrome.tabs.get(tabId);
          url = tab?.url;
        } catch {
          // ignore
        }
      }

      if (!url || !/^https?:/i.test(url)) {
        tabRiskCache.set(tabId, { ...existing, contentSignals });
        sendResponse({ ok: true });
        return;
      }

      const settings = await getSettings();
      urlRisk = urlRisk || evaluateUrlRisk(url, settings);
      const combined = computeCombinedRisk(urlRisk, contentSignals);
      cacheAndBroadcastRisk(tabId, url, urlRisk, contentSignals, combined);
      sendResponse({ ok: true });
    };

    applyWithUrl();
    return true;
  }

  return false;
});

