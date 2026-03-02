// LocalDetector for URL/domain heuristics and simple risk scoring.
// Phase 1: URL-only checks (blocklist, allowlist, length, TLD, digits, subdomains).

const BUILT_IN_ALLOWLIST = [
  'google.com',
  'gmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'facebook.com',
  'messenger.com',
  'whatsapp.com'
];

const BUILT_IN_BLOCKLIST = [
  // Example obviously bad domains (for demonstration only)
  'example-phishing-test.com'
];

const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

function parseDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function hasManyDigits(str) {
  const digits = (str.match(/[0-9]/g) || []).length;
  return digits >= 5;
}

function isSuspiciousTld(tld) {
  const badTlds = [
    'xyz',
    'top',
    'club',
    'work',
    'click',
    'link',
    'loan',
    'gq',
    'ml'
  ];
  return badTlds.includes(tld);
}

function looksLikeKnownBrandImpersonation(hostname) {
  const knownBrands = [
    'paypal.com',
    'microsoft.com',
    'apple.com',
    'bankofamerica.com',
    'chase.com'
  ];

  return knownBrands.some((brand) => {
    const base = brand.replace('.com', '');
    const pattern = new RegExp(base.replace(/a|o|e|i|l|s/gi, '[a-z0-9]'), 'i');
    return pattern.test(hostname) && !hostname.endsWith(brand);
  });
}

function getAllowlist(settings) {
  const user = (settings?.userAllowlist || []).filter(Boolean);
  return [...new Set([...BUILT_IN_ALLOWLIST, ...user])];
}

function getBlocklist(settings) {
  const user = (settings?.userBlocklist || []).filter(Boolean);
  return [...new Set([...BUILT_IN_BLOCKLIST, ...user])];
}

function computeUrlRiskSignals(urlString, settings) {
  const hostname = parseDomain(urlString);
  if (!hostname) {
    return {
      level: RISK_LEVELS.MEDIUM,
      score: 50,
      reasons: ['url_unparsable']
    };
  }

  const reasons = [];
  let score = 0;

  const allowlist = getAllowlist(settings);
  const blocklist = getBlocklist(settings);
  const allowMatch = allowlist.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  const blockMatch = blocklist.some((d) => hostname === d || hostname.endsWith(`.${d}`));

  if (allowMatch) {
    score -= 40;
    reasons.push('in_builtin_allowlist');
  }
  if (blockMatch) {
    score += 70;
    reasons.push('in_builtin_blocklist');
  }

  const tldMatch = hostname.match(/\.([a-z0-9-]+)$/i);
  const tld = tldMatch ? tldMatch[1].toLowerCase() : '';
  if (tld && isSuspiciousTld(tld)) {
    score += 25;
    reasons.push('suspicious_tld');
  }

  if (hostname.length > 40) {
    score += 20;
    reasons.push('very_long_domain');
  }

  const subdomainCount = hostname.split('.').length - 1;
  if (subdomainCount >= 3) {
    score += 15;
    reasons.push('many_subdomains');
  }

  if (hasManyDigits(hostname)) {
    score += 15;
    reasons.push('many_digits');
  }

  if (looksLikeKnownBrandImpersonation(hostname)) {
    score += 40;
    reasons.push('brand_lookalike');
  }

  const sensitivity = settings?.sensitivity || 'balanced';
  if (sensitivity === 'conservative') {
    score -= 10;
  } else if (sensitivity === 'strict') {
    score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  let level = RISK_LEVELS.LOW;
  if (score >= 70) {
    level = RISK_LEVELS.HIGH;
  } else if (score >= 35) {
    level = RISK_LEVELS.MEDIUM;
  }

  return {
    level,
    score,
    reasons
  };
}

export function evaluateUrlRisk(url, settings) {
  return computeUrlRiskSignals(url, settings);
}

