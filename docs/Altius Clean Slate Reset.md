# ALTIUS — Clean Slate Reset

## Purpose
Wipe the existing Altius codebase and Supabase project to prepare for a v5.0 rebuild. The current codebase is a pre-v4 prototype that shares no architecture with v5. Starting fresh is faster than retrofitting.

## What to Do

### 1. Git Repo (zackfunprojects/altius)

Delete everything except the git history and repo config. Then scaffold the empty v5 project.

```bash
# From repo root — remove all existing code
rm -rf src/ public/ supabase/
rm -f index.html postcss.config.js tailwind.config.js vite.config.js vercel.json netlify.toml
rm -f DEPLOY.md DEPLOY-GUIDE.md

# Keep: package.json (will be overwritten), .git/, README.md (if exists)
```

Then initialize the v5 project:

```bash
# Reinitialize with Vite + React
npm create vite@latest . -- --template react

# Install dependencies
npm install tailwindcss postcss autoprefixer @supabase/supabase-js react-router-dom lucide-react framer-motion

# Initialize Tailwind
npx tailwindcss init -p
```

Create the v5 file structure:

```
src/
  assets/
  components/
    ui/
    brand/
    mountaineer/
    ledges/
    exercises/
    trek/
  views/
  hooks/
  lib/
    supabase.js
    elevation.js
    sherpa.js
    weather.js
    terrain.js
    exercise.js
    trek.js
    expedition.js
    voice.js
  context/
  styles/
supabase/
  functions/
  migrations/
```

Create a `.env.example`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Commit as: `chore: clean slate for Altius v5.0 rebuild`

### 2. Supabase

Drop everything and start clean. Run this in the Supabase SQL Editor:

```sql
-- ═══════════════════════════════════════════════════════════
-- ALTIUS v5.0 — CLEAN SLATE
-- Drops all v3/v4 tables, types, triggers, and functions.
-- Run this ONCE, then run the v5 schema migration.
-- ═══════════════════════════════════════════════════════════

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS user_data_updated_at ON public.user_data;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop tables (cascade removes policies and indexes)
DROP TABLE IF EXISTS public.user_data CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any old ENUM types if they exist from prior experiments
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS learning_style CASCADE;
DROP TYPE IF EXISTS rank_type CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS note_tag CASCADE;
DROP TYPE IF EXISTS elevation_source CASCADE;

-- Verify clean state
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should return 0 rows.
```

That final SELECT confirms everything is gone. If any tables remain, drop them manually.

### 3. Supabase Storage

If any storage buckets exist (unlikely in current state), delete them:

```sql
-- Check for buckets
SELECT * FROM storage.buckets;

-- If any exist:
-- DELETE FROM storage.objects WHERE bucket_id = 'bucket_name';
-- DELETE FROM storage.buckets WHERE id = 'bucket_name';
```

### 4. Supabase Edge Functions

If any Edge Functions were deployed (unlikely), remove them:

```bash
# List deployed functions
supabase functions list

# Delete any that exist
supabase functions delete <function-name>
```

## After the Reset

The repo should contain:
- Empty Vite + React scaffold with Tailwind
- Correct dependency list for v5
- Empty directory structure matching the v5 build phases
- `.env.example` with required keys
- No legacy code, no legacy schema, no legacy types

Supabase should contain:
- Zero tables in the public schema
- Zero custom types
- Zero triggers or functions
- Auth system still intact (user accounts preserved if desired, or can be cleared in the Auth dashboard)

**Next step: Phase 1 of the v5 Build Phases doc — deploy the full v5 schema, brand tokens, and auth flow.**
