## Spidey Sense – Scam Warning (Prototype)

This is a Manifest V3 Chrome/Chromium extension that helps seniors and non‑native English speakers avoid online scams by showing a clear, color‑coded warning banner and popup based on simple, **local** URL heuristics.

### Features (Phase 1)

- **Local URL checks only** (no cloud calls, no keystroke logging).
- **Background service worker** that scores each visited URL and caches results.
- **Local detector** with blocklist/allowlist, TLD checks, domain length, subdomains, digits, and brand lookalike detection.
- **User allowlist/blocklist** – "Mark as safe" and "Report as scam" from the popup add domains to your lists.
- **Content script banner** with traffic‑light colors (green / amber / red), large fonts, and high contrast for seniors.
- **Popup UI** showing the current page risk level, score, and a short explanation of why the page was flagged.
- **Options page** for:
  - Turning the extension on or off.
  - Preferred language (English, Spanish, German).
  - Adjusting sensitivity (Conservative / Balanced / Strict).
  - Toggling a future **Advanced Protection** mode (currently stubbed).
- **Localization** with English, Spanish, and German in `_locales/*/messages.json`.

### Project structure

- `manifest.json` – MV3 configuration.
- `background.js` – service worker that monitors navigation and runs the local detector.
- `detector.js` – URL heuristic module (blocklist/allowlist, TLD, length, digits, subdomains, brand lookalikes).
- `contentScript.js` + `overlay.css` – in‑page banner shown at the top of each page.
- `popup.html/js/css` – action popup for quick status and actions.
- `options.html/js/css` – settings page for basic controls.
- `_locales/en/messages.json` – English localization.

### Running the extension in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `Spidey_sense` folder.
4. Visit a few test sites and watch the Spidey Sense icon and banner.

### Notes about privacy & Advanced Protection

- All current checks are done locally in the browser; URL text is **not** sent to any server.
- The **Advanced Protection** toggle in the options page is a **placeholder** only.
  - TODO: Implement a privacy‑preserving, opt‑in cloud API for additional checks.

