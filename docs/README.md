# Spidey Sense – Fraud Training Website

This folder contains a **training website** with several pages that **imitate common fraud scenarios**. Use it to:

- **Test the Spidey Sense extension** – Load the extension, then open these pages (via a local server or `file://`) and see how it scores and labels them.
- **Train users** (e.g. seniors, non‑native English speakers) to recognize scam patterns in a safe environment.

**No real data is collected.** Buttons and forms only show alerts; they do not submit anywhere.

## Language

- **English** – All pages in the root folder (`index.html`, `typosquatting.html`, etc.).
- **Spanish (Español)** – Same scenarios in the `es/` folder (`es/index.html`, `es/typosquatting.html`, etc.). Explanations and “what to watch for” text are in Spanish; you can switch using **English | Español** in the header (landing) or in the blue banner (scenario pages).

## How to open the training site

1. **Option A – Direct file open**  
   Double‑click `index.html` or drag it into Chrome. Pages will load from `file://`.  
   Note: Spidey Sense may treat `file://` URLs differently; for full extension behavior, use Option B.

2. **Option B – Local server (recommended for testing the extension)**  
   From the project root (parent of `training-site`):
   ```bash
   npx --yes serve training-site
   ```
   Or with Python: `cd training-site && python3 -m http.server 3000`  
   Then open the URL shown (e.g. `http://localhost:3000`) in Chrome with the Spidey Sense extension enabled.

## Scenarios included

| Page | Scenario | What it demonstrates |
|------|----------|----------------------|
| [typosquatting.html](typosquatting.html) | Typosquatting & reading URLs | How to read a domain left to right; defanged examples of fake domains (paypa1[.]com, etc.) |
| [phishing-emails.html](phishing-emails.html) | Phishing emails | Clean example emails and how to evaluate the true sender (display name vs. real address, Reply-To, hovering links) |
| [fake-login.html](fake-login.html) | Phishing | Fake bank/service login to steal credentials |
| [prize-lottery.html](prize-lottery.html) | Prize / lottery scam | “You’ve won!” + fees or personal/bank details |
| [tech-support.html](tech-support.html) | Tech support scam | Fake virus alert + “call this number” or remote access |
| [fake-shopping.html](fake-shopping.html) | Fake shopping | Too-good-to-be-true deal; asks for payment/shipping |
| [impersonation.html](impersonation.html) | Impersonation | Urgent request (e.g. “grandma”) for money or gift cards |
| [fake-charity.html](fake-charity.html) | Fake charity | Disaster/cause used to collect donations on a fake site |

Each scenario page has a blue **training banner** at the top and a green **“What to watch for”** (or “En este escenario”) section so it’s clear the content is for education only.
