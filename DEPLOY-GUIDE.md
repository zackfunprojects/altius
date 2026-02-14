# Altius — Deployment Guide

**Get Altius live on your own domain with user accounts in 6 steps.**

---

## Step 1: Push to GitHub

1. Create a new repository on [github.com](https://github.com/new)
   - Name it `altius` (or whatever you like)
   - Make it **Private** (recommended)
   - Do NOT initialize with README (we already have files)

2. In your terminal, from the `learnspace/` folder:
```bash
cd learnspace
git init
git add .
git commit -m "Initial commit — Altius learning hub"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/altius.git
git push -u origin main
```

---

## Step 2: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `altius`
   - **Database Password**: pick something strong (save it!)
   - **Region**: choose closest to your users
4. Wait ~2 minutes for the project to provision

---

## Step 3: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the ENTIRE contents of `supabase/schema.sql` from the project
4. Paste it into the SQL editor
5. Click **"Run"** — you should see "Success. No rows returned"

This creates:
- `profiles` table (user display names, onboarding status)
- `user_data` table (all app state as JSON)
- Row Level Security policies (users can only see their own data)
- Auto-triggers (profile created automatically on sign-up)

---

## Step 4: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (the long `eyJ...` string)
3. Create a `.env` file in your project root:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Important:** The `.env` file is in `.gitignore` and will NOT be committed to GitHub. You'll set these as environment variables in Vercel instead.

---

## Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **"Add New → Project"**
3. Import your `altius` repository from GitHub
4. Vercel auto-detects Vite — leave the defaults:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL` → paste your Project URL
   - `VITE_SUPABASE_ANON_KEY` → paste your anon key
6. Click **"Deploy"**
7. Wait ~1 minute — your site is live at `altius-xxxxx.vercel.app`!

---

## Step 6: Connect Your Custom Domain

### In Vercel:
1. Go to your project → **Settings → Domains**
2. Type your domain (e.g., `altius.app` or `tryaltius.com`)
3. Click **"Add"**
4. Vercel will show you DNS records to configure

### At your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):
5. Add the DNS records Vercel gave you:
   - For apex domain (`altius.app`): **A record** → `76.76.21.21`
   - For www subdomain: **CNAME** → `cname.vercel-dns.com`
6. Wait for DNS to propagate (usually 5-30 minutes, sometimes up to 48 hours)
7. Vercel automatically provisions an SSL certificate

### Update Supabase settings:
8. In Supabase dashboard → **Authentication → URL Configuration**:
   - Set **Site URL** to `https://yourdomain.com`
   - Add `https://yourdomain.com/**` to **Redirect URLs**
   - Also add `https://yourdomain.com` (without wildcard)

---

## You're Live!

At this point:
- Users can visit your domain
- They'll see the Altius login/signup page
- New users create an account → go through onboarding → their data saves to Supabase
- Returning users log in → their data loads from Supabase
- All data is isolated per-user via Row Level Security

---

## Optional: Configure Email Templates

In Supabase dashboard → **Authentication → Email Templates**, you can customize:
- **Confirm signup** email (the verification email new users get)
- **Reset password** email
- **Magic link** email

You can brand these with the Altius name and style.

---

## Optional: Turn Off Email Confirmation (for faster testing)

If you want users to skip the "confirm your email" step:
1. Supabase dashboard → **Authentication → Providers → Email**
2. Toggle OFF **"Confirm email"**

> Note: For production, you'll probably want this ON to prevent spam sign-ups.

---

## Local Development

To run locally:
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/altius.git
cd altius

# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your actual values

# Run dev server
npm run dev
```

Your app will be at `http://localhost:5173`

---

## Project Structure

```
altius/
├── public/
│   └── favicon.svg              # 8-bit pixel mountain icon
├── src/
│   ├── components/
│   │   └── AuthPage.jsx         # Login / Signup / Password reset
│   ├── lib/
│   │   └── supabase.js          # Supabase client initialization
│   ├── App.jsx                  # Main app (all views, state, CRUD)
│   ├── main.jsx                 # Auth routing + data loading
│   └── index.css                # Tailwind imports
├── supabase/
│   └── schema.sql               # Database schema (run in SQL Editor)
├── .env.example                 # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── vercel.json                  # Vercel SPA routing config
└── netlify.toml                 # Netlify config (if using Netlify instead)
```
