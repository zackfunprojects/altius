# Deploying Learnspace

## Quick Start (Local)

```bash
npm install
npm run dev        # → http://localhost:5173
```

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the build locally
```

---

## Option 1: Vercel (Recommended — Easiest)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**
5. Done. You'll get a URL like `learnspace-xyz.vercel.app`

**Custom domain:** In Vercel dashboard → Settings → Domains → Add your domain.

---

## Option 2: Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Select your repo
4. Build command: `npm run build` · Publish directory: `dist`
5. Click **Deploy**

The `netlify.toml` in this project auto-configures everything.

**Custom domain:** Site settings → Domain management → Add custom domain.

---

## Option 3: GitHub Pages (Free)

1. Install the GitHub Pages Vite plugin:
   ```bash
   npm install -D vite-plugin-gh-pages
   ```

2. In `vite.config.js`, set your base path:
   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

3. Add a deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && npx gh-pages -d dist"
   }
   ```

4. Run `npm run deploy`

Your site will be at `https://yourusername.github.io/your-repo-name/`

---

## Option 4: Any Static Host

Run `npm run build`, then upload the `dist/` folder to any static hosting:
Cloudflare Pages, AWS S3 + CloudFront, Firebase Hosting, Render, Railway, etc.

---

## Custom Domain Setup (General)

1. Buy a domain from any registrar (Namecheap, Google Domains, Cloudflare, etc.)
2. In your hosting dashboard, add the custom domain
3. Point your domain's DNS:
   - **A record** → your host's IP (provided in their dashboard)
   - **CNAME** → `your-app.vercel.app` or equivalent
4. Enable HTTPS (usually automatic on Vercel/Netlify)

---

## Chrome Extension

The Learnspace Sync extension connects to your running app. After deploying:

1. Open `learnspace-extension/manifest.json`
2. In the `content_scripts` section, add your live domain:
   ```json
   {
     "matches": ["https://your-domain.com/*"],
     "js": ["content-scripts/learnspace-bridge.js"]
   }
   ```
3. Reload the extension in `chrome://extensions`
