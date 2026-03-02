function msg(key) {
  try {
    return chrome.i18n.getMessage(key) || '';
  } catch {
    return '';
  }
}

const REASON_MESSAGES = {
  in_builtin_allowlist: 'popup_reason_allowlist',
  in_builtin_blocklist: 'popup_reason_blocklist',
  suspicious_tld: 'popup_reason_suspicious_tld',
  very_long_domain: 'popup_reason_long_domain',
  many_subdomains: 'popup_reason_many_subdomains',
  many_digits: 'popup_reason_many_digits',
  brand_lookalike: 'popup_reason_brand_lookalike',
  url_unparsable: 'popup_reason_unparsable',
  content_gift_cards: 'popup_reason_content_gift_cards',
  content_wire_transfer: 'popup_reason_content_wire_transfer',
  content_remote_access: 'popup_reason_content_remote_access',
  content_account_verification: 'popup_reason_content_account_verification',
  content_urgent_threat: 'popup_reason_content_urgent_threat',
  content_crypto: 'popup_reason_content_crypto'
};

function getReasonNote(risk) {
  const reasons = risk?.reasons || [];
  for (const r of reasons) {
    const key = REASON_MESSAGES[r];
    if (key) {
      const text = msg(key);
      if (text) return text;
    }
  }
  return msg('popup_note_text') || 'Scams often try to rush you or ask for money, gift cards, or personal codes.';
}

function setRiskView(risk) {
  const riskLabel = document.getElementById('risk-label');
  const riskScore = document.getElementById('risk-score');
  const riskNote = document.getElementById('risk-note');

  if (!risk || risk.level === 'OFF') {
    riskLabel.textContent = msg('popup_off_label') || 'Extension is turned off for this page.';
    riskScore.textContent = '';
    riskNote.textContent = '';
    riskLabel.className = 'risk-label off';
    return;
  }

  let label;
  if (risk.level === 'LOW') {
    label = msg('popup_safe_label') || 'Looks OK so far.';
    riskLabel.className = 'risk-label low';
  } else if (risk.level === 'MEDIUM') {
    label = msg('popup_caution_label') || 'Please be careful.';
    riskLabel.className = 'risk-label medium';
  } else {
    label = msg('popup_danger_label') || 'Danger: This may be a scam.';
    riskLabel.className = 'risk-label high';
  }

  riskLabel.textContent = label;
  riskScore.textContent = msg('popup_score_prefix') + ' ' + (risk.score ?? 0) + '/100';
  riskNote.textContent = getReasonNote(risk);
}

function init() {
  document.getElementById('title').textContent =
    msg('popup_title') || 'Spidey Sense';
  document.getElementById('mark-safe').textContent =
    msg('popup_mark_safe_button') || 'Mark this as safe';
  document.getElementById('report-scam').textContent =
    msg('popup_report_scam_button') || 'Report as scam';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    chrome.runtime.sendMessage(
      {
        type: 'GET_CURRENT_RISK',
        payload: { tabId: tab.id }
      },
      (response) => {
        if (response?.ok && response.data?.risk) {
          setRiskView(response.data.risk);
        } else {
          setRiskView(null);
        }
      }
    );

    document
      .getElementById('mark-safe')
      .addEventListener('click', () => {
        chrome.tabs.sendMessage(tab.id, { type: 'MARK_SAFE_CLICKED' }, () => {});
        chrome.runtime.sendMessage({ type: 'MARK_SAFE', payload: { tabId: tab.id } });
        window.close();
      });

    document
      .getElementById('report-scam')
      .addEventListener('click', () => {
        chrome.tabs.sendMessage(tab.id, { type: 'REPORT_SCAM_CLICKED' }, () => {});
        chrome.runtime.sendMessage({ type: 'REPORT_SCAM', payload: { tabId: tab.id } });
        window.close();
      });
  });
}

document.addEventListener('DOMContentLoaded', init);

