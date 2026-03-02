function msg(key) {
  try {
    return chrome.i18n.getMessage(key) || '';
  } catch {
    return '';
  }
}

function loadSettings() {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    const settings = response?.settings || {};

    document.getElementById('enabled-toggle').checked = !!settings.enabled;

    const langSelect = document.getElementById('language-select');
    const lang = settings.language || 'en';
    if (langSelect) langSelect.value = lang;

    const radios = document.querySelectorAll('input[name="sensitivity"]');
    radios.forEach((r) => {
      r.checked = r.value === (settings.sensitivity || 'balanced');
    });

    document.getElementById('advanced-toggle').checked =
      !!settings.advancedProtectionEnabled;
  });
}

function saveSettings() {
  const enabled = document.getElementById('enabled-toggle').checked;
  const langSelect = document.getElementById('language-select');
  const language = langSelect ? langSelect.value : 'en';
  const advanced = document.getElementById('advanced-toggle').checked;
  const radios = document.querySelectorAll('input[name="sensitivity"]');
  let sensitivity = 'balanced';
  radios.forEach((r) => {
    if (r.checked) sensitivity = r.value;
  });

  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    payload: { enabled, language, advancedProtectionEnabled: advanced, sensitivity }
  });
}

function initText() {
  document.getElementById('options-title').textContent =
    msg('options_title') || 'Spidey Sense settings';
  document.getElementById('enabled-label').textContent =
    msg('options_enabled_label') || 'Turn Spidey Sense on';
  document.getElementById('language-label').textContent =
    msg('options_language_label') || 'Language';
  document.getElementById('language-hint').textContent =
    msg('options_language_hint') || 'English, Spanish, and German are available.';
  document.getElementById('sensitivity-label').textContent =
    msg('options_sensitivity_label') || 'How careful should we be?';
  document.getElementById('sensitivity-conservative').textContent =
    msg('options_sensitivity_conservative') || 'Conservative (fewer alerts)';
  document.getElementById('sensitivity-balanced').textContent =
    msg('options_sensitivity_balanced') || 'Balanced';
  document.getElementById('sensitivity-strict').textContent =
    msg('options_sensitivity_strict') || 'Strict (more alerts)';
  document.getElementById('advanced-label').textContent =
    msg('options_advanced_label') || 'Advanced Protection (cloud checks)';
  document.getElementById('advanced-description').textContent =
    msg('options_advanced_description') ||
    'When turned on (future feature), small pieces of information may be sent to a secure server to improve protection. This is always optional.';
}

function init() {
  initText();
  loadSettings();

  document
    .getElementById('enabled-toggle')
    .addEventListener('change', saveSettings);
  document
    .getElementById('language-select')
    .addEventListener('change', saveSettings);
  document
    .getElementById('advanced-toggle')
    .addEventListener('change', saveSettings);
  document
    .querySelectorAll('input[name="sensitivity"]')
    .forEach((r) => r.addEventListener('change', saveSettings));
}

document.addEventListener('DOMContentLoaded', init);

