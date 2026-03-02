# Hosting the training site on GitHub Pages

The **training site** (fraud scenario demos) is in the `docs/` folder so you can host it for free on GitHub Pages.

## One-time setup

### 1. Create a GitHub repo and push your code

If you haven’t already:

```bash
cd /path/to/Spidey_sense
git init
git add .
git commit -m "Initial commit: Spidey Sense extension + training site"
```

On GitHub: **New repository** (e.g. name: `Spidey_sense` or `spidey-sense`). Do **not** add a README (you already have one). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.)

### 2. Turn on GitHub Pages

1. Open your repo on GitHub.
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/docs`
4. Click **Save**.

After a minute or two, the site will be at:

**https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/**

Example: if the repo is `Spidey_sense` and your username is `jane`, the URL is  
`https://jane.github.io/Spidey_sense/`

---

## Updating the site

When you change the training site, update the `docs/` folder and push:

```bash
# From project root – copy latest training-site into docs
cp -r training-site/* docs/
git add docs/
git commit -m "Update training site"
git push
```

GitHub will redeploy automatically; changes can take 1–2 minutes to appear.

---

## Optional: custom domain

In **Settings → Pages** you can set a **Custom domain** (e.g. `training.yourdomain.com`). GitHub will show how to add the right DNS records. HTTPS is supported for custom domains.
