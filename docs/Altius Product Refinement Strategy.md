# ALTIUS — v5.0

> Everything Worth Knowing is Uphill. Keep Climbing.

Altius is an AI-powered learning engine that turns any skill into a personalized mountain trek — with generated lesson plans, interactive exercises, and verifiable mastery. No courses to buy. No tutorials to hunt for. Tell the Sherpa what you want to learn, and the expedition begins.

This is a subscription product. It replaces courses.

---

## PRODUCT OVERVIEW

The user says what they want to learn. The AI builds a complete **trek** — a structured curriculum expressed as a mountain climb. The trek has **camps** (major milestones), **trail sections** (lessons), and a **summit** (mastery verification). The **Sherpa** guides through every step, teaching interactively, adapting to pace, and verifying understanding before advancing.

When the user summits, the skill goes into their **Trek Notebook** — a permanent portfolio of mastered skills. The 8-bit mountaineer character accumulates gear/badges from each completed trek. Every user's mountaineer looks different because every user has climbed different mountains.

### The Core Loop

1. **Prepare a Trek** — tell the Sherpa what you want to learn. It scopes the skill, estimates difficulty/duration, builds the trail map.
2. **Climb** — work through interactive lessons, exercises, quizzes, and projects. The Sherpa teaches, adapts, and checks understanding at every camp.
3. **Summit** — complete a mastery challenge proving you learned the skill. Challenge matches the skill: build something, pass an assessment, demonstrate competence.
4. **Record** — completed trek goes in Trek Notebook. Mountaineer gains the skill badge. Sherpa writes the Summit Entry.
5. **Prepare the next trek** — repeat.

### Running Example

Throughout this doc, the running example is: **learning to make SaaS launch videos** (the polished product videos you see on Product Hunt/LinkedIn). A skill with no obvious curriculum requiring storyboarding, screen recording, motion design, editing, sound design, and pacing.

---

## THE SHERPA

The Sherpa is the AI tutor and guide. Patient, warm, mountaineering-voiced. It actually teaches — generates curricula, delivers lessons, creates exercises, evaluates work, verifies mastery.

### System Prompt

```
You are The Sherpa — a patient, deeply experienced mountain guide who teaches climbers the skills they need to reach their summits. You speak with warmth and unhurried wisdom. You use the language of the mountain naturally: weather, terrain, pace, rest, altitude. You never shame the climber for slowness or gaps. You treat difficulty as the mountain teaching, not the climber failing.

You are not a chatbot. You are a tutor and guide. You build trails, teach lessons, create exercises, and verify mastery. Your teaching is specific, adaptive, and honest. You do not move a climber forward until they are ready. You do not simplify to the point of dishonesty. You meet each climber exactly where they are and take them exactly where they need to go.

You never say "Great job" or give generic praise. Everything you say is specific to this climber, this skill, this moment on the trail.
```

### Sherpa Roles

- **Trek Architect** — scopes the skill, builds the trail map, defines camps and summit challenge
- **Prerequisite Interviewer** — assesses what the climber already knows
- **Lesson Instructor** — teaches concepts, walks through examples, explains principles
- **Exercise Creator** — generates interactive challenges, quizzes, projects
- **Progress Evaluator** — checks understanding at camp checkpoints, gives specific feedback
- **Summit Judge** — evaluates the mastery challenge honestly with rubric-based feedback
- **Notebook Author** — writes the Summit Entry and skill record

### Voice Samples

**Starting a trek:**
> So. Launch videos. The ones that make people stop scrolling and think "I need that." This is a real skill — not just software knowledge. It is storytelling, visual rhythm, and restraint. The trek is moderate. Two to three weeks if you show up most days. The summit is a finished video. Ready to pack?

**Teaching a concept:**
> Every great launch video follows the same structure, whether the creator knows it or not. Three seconds to hook. Ten seconds to show the pain. Twenty seconds to show the product solving it. Five seconds to land. This is the shape. We will learn to fill it.

**After a failed exercise:**
> Your storyboard has the right ideas in the wrong order. You led with features. The viewer does not care about features yet — they care about their problem. Flip it. Start with the frustration. Then the relief. Try again.

**At the summit:**
> I have watched your video three times. The hook lands. The pacing is confident. The sound design is clean. You made something a real company could ship. This trek is done. The skill is yours now.

### Context Assembly (5 Blocks)

Every Sherpa call assembles these server-side:

**Block 1 — SHERPA CHARACTER:** The system prompt above.

**Block 2 — EXPEDITION STATE:**
```
Climber: {display_name}
Elevation: {current_elevation} ft
Expedition Day: {computed from created_at}
Subscription: {tier}
Treks Completed: {total_treks_completed}
Active Trek: {trek_name} ({difficulty}) - Camp {N}: {camp_name}
```

**Block 3 — ACTIVE TREK CONTEXT:**
```
Trek: {trek_name}
Skill: {skill_description}
Current Camp: {camp_name} ({camp_number}/{total_camps})
Current Section: {section.title} ({section_number})
Exercise Performance: avg score, strengths, weaknesses, exercises failed 2+ times
Prerequisites: {prerequisite_answers summary}
```

**Block 4 — TREK JOURNAL:**
```
Recent Notes (last 10), Camp Reflections, Questions Asked
```

**Block 5 — TREK NOTEBOOK (Cross-Trek Memory):**
```
Completed Treks: skill_name, summit day, key concepts
Relevant Prior Knowledge: concepts from notebook overlapping active trek
```

---

## BRAND IDENTITY

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Summit Cobalt | `#1A3D7C` | Primary accent, Sherpa dialog borders, links |
| Fitz Violet | `#5C2D82` | Secondary accent, creative elements |
| Signal Orange | `#D9511C` | CTAs, warnings, progress |
| Alpine Gold | `#D4960B` | Achievements, completions, summit highlights |
| Ink | `#1C1814` | Body text, primary dark |
| Dark Earth | `#2C2418` | Secondary dark, nav bg |
| Trail Brown | `#8B7355` | Metadata, secondary text, borders |
| Catalog Cream | `#F4EDE0` | Paper backgrounds, journal aesthetic |
| Terminal Dark | `#0D0F14` | CRT backgrounds, Sherpa panels |
| Phosphor Green | `#4ADE80` | Elevation counter, active states, CRT accents |

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | DM Serif Display | Headings, trek names, camp names, wordmark |
| Body | Crimson Pro (300–600 + italic) | Lesson content, journal entries, descriptions |
| UI | Inter (500–600) | Buttons, labels, nav, metadata |
| Mono | Courier New | Sherpa voice, CRT elements, elevation counter, code |

### Tailwind Config

```js
colors: {
  'summit-cobalt': '#1A3D7C',
  'fitz-violet': '#5C2D82',
  'signal-orange': '#D9511C',
  'alpine-gold': '#D4960B',
  'ink': '#1C1814',
  'dark-earth': '#2C2418',
  'trail-brown': '#8B7355',
  'catalog-cream': '#F4EDE0',
  'terminal-dark': '#0D0F14',
  'phosphor-green': '#4ADE80',
}
fontFamily: {
  'display': ['DM Serif Display', 'serif'],
  'body': ['Crimson Pro', 'serif'],
  'ui': ['Inter', 'sans-serif'],
  'mono': ['Courier New', 'monospace'],
}
```

### Three Visual Registers

1. **Trail View** — CRT bezel + painterly mountain. Scanlines, vignette, phosphor glow. Mountain scene with weather layers, camp markers, mountaineer character.
2. **Learning View** — Clean editorial. Catalog cream backgrounds, Crimson Pro body, generous spacing. Where lessons and exercises render.
3. **Pocket** — Topo GPS device. Terminal dark, topographic grid lines, contour lines in muted cobalt, Courier New throughout.

### Brand Components

- `FourColorBar` — 4-band stripe (cobalt, violet, orange, gold)
- `MountainMark` — SVG mountain with sunset gradient fill + ink ridgeline stroke
- `WordMark` — "ALTIUS" in DM Serif Display with letter-spacing
- `SherpaTerminal` — CRT-styled text display for Sherpa voice
- `JournalPaper` — Cream-paper-textured container for journal/notebook content
- `DifficultyBadge` — Day Hike / Weekend Trek / Expedition / Siege badges

### CRT Effects

```css
.crt-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
  pointer-events: none;
}
.crt-vignette::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
}
.phosphor-glow {
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
}
```

---

## TECH STACK

- **Web:** React 18 + Vite 5
- **Mobile (Pocket):** React Native / Expo
- **Styling:** Tailwind CSS with brand tokens
- **Backend:** Supabase (Auth, Postgres, Edge Functions, Storage)
- **AI:** Anthropic Claude (claude-sonnet-4-20250514 for all AI calls)
- **Voice:** Whisper API (STT), ElevenLabs or equivalent (TTS)
- **Web deploy:** Vercel
- **Mobile deploy:** Expo EAS

---

## DATABASE SCHEMA

### ENUM Types

```sql
CREATE TYPE trek_difficulty AS ENUM ('day_hike', 'weekend_trek', 'expedition', 'siege');
CREATE TYPE trek_status AS ENUM ('proposed', 'active', 'paused', 'completed', 'abandoned');
CREATE TYPE camp_status AS ENUM ('locked', 'active', 'completed');
CREATE TYPE section_status AS ENUM ('locked', 'active', 'completed', 'skipped');
CREATE TYPE section_type AS ENUM ('concept', 'exercise', 'demonstration', 'guided_analysis', 'project_step', 'reflection', 'tool_tutorial', 'branching_scenario', 'parallel_route');
CREATE TYPE exercise_type AS ENUM ('multiple_choice', 'short_answer', 'drag_sequence', 'code_editor', 'timeline_editor', 'canvas_layout', 'writing_prompt', 'file_upload', 'voice_response', 'conversation_sim');
CREATE TYPE modality AS ENUM ('fireside', 'trail_sketch', 'demonstration', 'practice_ledge', 'over_the_shoulder', 'branching_scenario', 'parallel_route', 'guided_analysis', 'multimodal_input');
CREATE TYPE elevation_source AS ENUM ('lesson_completed', 'exercise_passed', 'camp_reached', 'summit_completed', 'journal_note', 'event_bonus');
CREATE TYPE event_type AS ENUM ('trek_started', 'camp_reached', 'summit_attempted', 'summit_completed', 'weather', 'narrative', 'morning_question');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
```

### Tables

**profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  current_elevation INTEGER DEFAULT 0,
  subscription_tier subscription_tier DEFAULT 'free',
  total_treks_completed INTEGER DEFAULT 0,
  expedition_origin TEXT,
  expedition_vision TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**treks**
```sql
CREATE TABLE treks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  skill_description TEXT NOT NULL,
  trek_name TEXT NOT NULL,
  difficulty trek_difficulty NOT NULL,
  status trek_status DEFAULT 'proposed',
  estimated_duration TEXT,
  summit_challenge JSONB NOT NULL,
  summit_deliverable_url TEXT,
  summit_entry TEXT,
  skill_badge JSONB,
  terrain_params JSONB,
  prerequisite_answers JSONB,
  tool_recommendations JSONB,
  total_camps INTEGER DEFAULT 0,
  completed_camps INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_treks_user ON treks(user_id, status);
```

**camps**
```sql
CREATE TABLE camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  camp_number INTEGER NOT NULL,
  camp_name TEXT NOT NULL,
  learning_objectives JSONB NOT NULL,
  checkpoint_definition JSONB,
  status camp_status DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trek_id, camp_number)
);
CREATE INDEX idx_camps_trek ON camps(trek_id, camp_number);
```

**trail_sections**
```sql
CREATE TABLE trail_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES camps(id) ON DELETE CASCADE NOT NULL,
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  section_type section_type NOT NULL,
  modalities modality[] NOT NULL,
  content JSONB,
  exercise_spec JSONB,
  status section_status DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camp_id, section_number)
);
CREATE INDEX idx_sections_camp ON trail_sections(camp_id, section_number);
CREATE INDEX idx_sections_trek ON trail_sections(trek_id);
```

**exercise_responses**
```sql
CREATE TABLE exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES trail_sections(id) ON DELETE CASCADE NOT NULL,
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  response JSONB NOT NULL,
  evaluation JSONB,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_responses_section ON exercise_responses(section_id, attempt_number);
```

**trek_journal**
```sql
CREATE TABLE trek_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  section_id UUID REFERENCES trail_sections(id),
  camp_id UUID REFERENCES camps(id),
  body TEXT NOT NULL,
  is_camp_reflection BOOLEAN DEFAULT false,
  sherpa_response TEXT,
  expedition_day INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_journal_trek ON trek_journal(trek_id, created_at DESC);
```

**trek_notebook**
```sql
CREATE TABLE trek_notebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  trek_id UUID REFERENCES treks(id) NOT NULL,
  skill_name TEXT NOT NULL,
  skill_badge JSONB NOT NULL,
  summit_date INTEGER NOT NULL,
  summit_entry TEXT NOT NULL,
  key_concepts JSONB NOT NULL,
  time_invested_minutes INTEGER,
  summit_deliverable_url TEXT,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trek_id)
);
CREATE INDEX idx_notebook_user ON trek_notebook(user_id, created_at DESC);
```

**elevation_log**
```sql
CREATE TABLE elevation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  delta INTEGER NOT NULL,
  total_after INTEGER NOT NULL,
  source_type elevation_source NOT NULL,
  source_id UUID,
  trek_id UUID REFERENCES treks(id),
  logged_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_elevation_user ON elevation_log(user_id, logged_at DESC);
```

**expedition_events**
```sql
CREATE TABLE expedition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  trek_id UUID REFERENCES treks(id),
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  elevation_bonus INTEGER DEFAULT 0,
  metadata JSONB,
  fired_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_user ON expedition_events(user_id, fired_at DESC);
```

### RLS Pattern

Enable RLS on ALL tables:
```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rows" ON {table}
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
For profiles: `auth.uid() = id` (not user_id). SELECT + UPDATE only, no DELETE.

### Auto-Create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, current_elevation, subscription_tier)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), 0, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## ELEVATION SYSTEM

```
lesson_completed:  +10 ft
exercise_passed:   +15 ft (first attempt), +10 ft (subsequent)
camp_reached:      +50 ft
summit_completed:  +200 ft (day_hike), +500 ft (weekend_trek), +1000 ft (expedition), +2000 ft (siege)
journal_note:      +2 ft
event_bonus:       variable
```

Elevation counter: Courier New bold, phosphor green, format `▲ 1,247 ft`. Animates on change.

---

## FILE STRUCTURE

```
src/
  assets/
  components/
    ui/             — Button, Input, Card, Modal, Loader, Toast
    brand/          — FourColorBar, MountainMark, WordMark, SherpaTerminal, JournalPaper, DifficultyBadge
    mountaineer/    — MountaineerSVG with skill badge system
    ledges/         — MultipleChoiceLedge, ShortAnswerLedge, DragSequenceLedge, CodeEditorLedge, TimelineEditorLedge, CanvasLayoutLedge, StoryboardLedge, WritingEditorLedge, ConversationSimLedge, DiagramBuilderLedge, FileUploadLedge, VoiceResponseLedge
    exercises/      — ExerciseWrapper (routes to correct Ledge based on exercise_type)
    trek/           — TrekCard, TrailMap, CampMarker, TrekProposal, LessonRenderer, TrailSketchBlock, DemonstrationBlock, GuidedAnalysisBlock, ParallelRouteBlock, BranchingScenarioBlock, SherpaAside, CoachingPanel, FiresideMode
  views/            — AuthView, OnboardingFlow, LearningView, TrailView, SherpaChat, TrekNotebookView, SummitChallenge, ExpeditionLog, SettingsView
  hooks/            — useProfile, useTreks, useActiveTrek, useCamps, useTrailSections, useCurrentSection, useExerciseResponses, useTrekJournal, useTrekNotebook, useExpeditionEvents, useElevationLog
  lib/
    supabase.js     — Supabase client init
    elevation.js    — awardElevation(), elevation calculations
    sherpa.js       — All Edge Function call wrappers
    weather.js      — calculateWeatherState()
    terrain.js      — computeTerrainParams()
    exercise.js     — Exercise evaluation helpers
    trek.js         — Trek lifecycle: create, activate, complete, abandon, section/camp progression
    expedition.js   — getExpeditionDay()
    voice.js        — STT/TTS wrappers
  context/          — AuthContext, TrekContext, LessonContext
  styles/           — globals.css, crt-effects.css
supabase/
  functions/        — All Edge Functions
  migrations/       — SQL migration files
```

---

## EDGE FUNCTIONS

| Function | Trigger | Purpose |
|----------|---------|---------|
| `sherpa` | Chat message | Main conversational AI with 5-block context |
| `sherpa-voice` | Voice input | STT → Sherpa response → TTS for Fireside Lessons |
| `trek-interview` | Onboarding screen 2 | Generate 2–3 prerequisite questions for a skill |
| `trek-generate` | Onboarding / new trek | Generate full trek structure (camps, sections, rubric) |
| `lesson-generate` | Section activated | On-demand lesson content for a trail section |
| `exercise-evaluate` | Exercise submission | AI evaluation of response against rubric |
| `summit-evaluate` | Summit submission | Full rubric evaluation of mastery challenge |
| `screen-analyze` | OTS screenshot | Analyze screen and generate coaching |
| `scenario-advance` | Branching scenario turn | NPC response + state update |
| `morning-question` | First daily open | Daily question from active trek context |
| `skill-refresh` | Refresh button | Compressed review exercises for completed trek |

All Edge Functions call `claude-sonnet-4-20250514`. All include the Sherpa character block. All return Sherpa-voiced text.

---

## THE NINE TEACHING MODALITIES

| Modality | Trail Name | What It Does |
|----------|------------|-------------|
| Voice Dialogue | Fireside Lessons | Spoken Socratic conversation between Sherpa and learner |
| Live Canvas | Trail Sketches | Diagrams/flowcharts generated and narrated step by step |
| Agent Demonstrations | The Sherpa Shows the Way | Sherpa performs the skill with narrated decisions |
| Simulated Environments | Practice Ledges | Simplified in-app tools for hands-on practice (zero setup) |
| Screen-Aware Coaching | Over-the-Shoulder | Sherpa watches your screen in real tools, coaches live |
| Branching Scenarios | Fork in the Trail | Interactive role-plays with consequences |
| Build-Alongside | Parallel Routes | You and Sherpa build the same thing, then compare |
| Guided Analysis | Reading the Mountain | Curated real-world examples with structured analysis |
| Multimodal Input | Show the Sherpa | Submit photos, voice memos, recordings, sketches for evaluation |

### Practice Ledge Types

| Ledge | Skills Served |
|-------|--------------|
| Code Editor | Programming, scripting, data (JS, Python/Pyodide, SQL/sql.js) |
| Timeline Editor | Video editing, audio, animation (drag, trim, reorder clips) |
| Canvas / Layout | Design, UI/UX, typography (drag, resize, align) |
| Storyboard Board | Video, presentations, UX flows (card sequencing) |
| Writing Editor | Copywriting, essays, technical writing (AI inline markup) |
| Conversation Sim | Sales, negotiation, interviews (Sherpa plays NPC) |
| Diagram Builder | Systems thinking, architecture (node-and-edge canvas) |
| File Upload | Creative deliverables (image, video, audio, PDF) |
| Voice Response | Presentations, pitches, verbal skills (record, transcribe, evaluate) |
| Multiple Choice | Knowledge checks |
| Short Answer | Conceptual understanding |
| Drag Sequence | Ordering, ranking, sequencing |

---

## LESSON CONTENT FORMAT

Generated on-demand, stored as JSONB in `trail_sections.content`:

```json
{
  "narrative": [
    { "type": "sherpa_text", "content": "Every great launch video follows..." },
    { "type": "trail_sketch", "spec": { "sketch_type": "timeline", "steps": [...] } },
    { "type": "exercise", "spec": { "exercise_type": "drag_sequence", ... } },
    { "type": "demonstration", "steps": [{ "frame_description": "...", "narration": "..." }] },
    { "type": "guided_analysis", "examples": [...], "framework": {...} },
    { "type": "tool_recommendation", "tools": [...] }
  ],
  "exercise_spec": { ... },
  "estimated_minutes": 15
}
```

---

## EXERCISE EVALUATION FORMAT

```json
{
  "passed": true,
  "score": 0.85,
  "feedback": "Your storyboard has the right...",
  "dimension_scores": [
    { "dimension": "Sequence logic", "score": 0.9, "note": "Strong hook placement" }
  ],
  "hints_for_retry": "Focus on the transition between scenes 3 and 4..."
}
```

Pass threshold default: 0.7. Feedback is always Sherpa-voiced and specific.

---

## SUMMIT EVALUATION FORMAT

```json
{
  "passed": true,
  "overall_score": 0.82,
  "dimension_scores": [
    { "dimension": "Hook effectiveness", "score": 0.9, "feedback": "Your hook lands in 2.5s..." }
  ],
  "summit_entry": "I have watched it four times...",
  "retry_guidance": null
}
```

Pass: all dimensions ≥ 0.6 AND overall ≥ 0.7.

---

## TREK GENERATION FORMAT

```json
{
  "trek_name": "The Launch Video Trail",
  "difficulty": "weekend_trek",
  "estimated_duration": "2-3 weeks at 30 minutes per day",
  "terrain_params": { ... },
  "skill_badge": { "icon": "camera", "label": "Launch Videos", "color": "#D9511C" },
  "tool_recommendations": [...],
  "summit_challenge": {
    "description": "Produce a 45-75 second launch video...",
    "rubric": [{ "dimension": "Hook effectiveness", "weight": 0.2, "criteria": "..." }]
  },
  "camps": [
    {
      "camp_number": 0,
      "camp_name": "Base Camp: The Storyboard",
      "learning_objectives": ["Understand launch video structure"],
      "sections": [
        { "section_number": 1, "title": "What makes a great launch video", "section_type": "concept", "modalities": ["fireside", "guided_analysis"] }
      ],
      "checkpoint": { "type": "drag_sequence", "description": "..." }
    }
  ]
}
```

Section content NOT generated here — only structure. Content generates on-demand per section.

---

## SUBSCRIPTION TIERS

| | Free | Pro |
|---|---|---|
| Active treks | 1 | Unlimited |
| Difficulty levels | Day Hike only | All |
| Trek Notebook | 3 entries | Unlimited |
| Skill Refresh | — | ✓ |
| Over-the-Shoulder | — | ✓ |
| Price | $0 | $15–25/mo |

---

## ADAPTIVE INTELLIGENCE

- **Spaced retrieval:** Sherpa weaves earlier concepts into later lessons without announcing it.
- **Difficulty calibration:** Above range → compress/skip. Below range → slow down, switch modalities, add exercises.
- **Cross-trek memory:** Notebook informs future treks. Overlapping camps compressed.
- **Time-aware:** Quick (15 min) = 1 section. Standard (30 min) = 2–3. Deep (60+) = full camp.

---

## WEATHER SYSTEM

- Active (5+ sections/week): clear sky, bright
- 3-day gap: clouds, slight fog
- 7-day gap: deep fog
- Active streak: perfect conditions, snow on peaks
- Trek paused: heavy atmosphere
- Return after absence: fog lifting, warm amber

---

## MOUNTAINEER CHARACTER

32×32 pixel art. Skill badges from completed treks (not ranks):
- "Launch Videos" → camera
- "SQL" → database scroll
- "Figma" → design compass
- "Python" → snake emblem

Max 6 displayed. Badge from `trek_notebook.skill_badge`.

---

## KEY UX RULES

- Loading states: Courier New CRT text. Never generic spinners.
- Empty states: Sherpa-voiced messages.
- Sherpa never says "Great job" — all feedback specific.
- No leaderboards, no competition.
- Oregon Trail-style event dialogs.
- Elevation counter visible at all times.
- All AI output is Sherpa-voiced.
- Summit cards: vintage expedition postcard aesthetic.

---

## ONBOARDING (3 SCREENS)

1. **Arrival:** "What skill are you here to learn?" → freeform → first trek's skill_description
2. **Prerequisite Interview:** 2–3 AI-generated questions specific to the skill
3. **Trek Generation Moment:** Mountain builds, Trek Proposal appears, user confirms → Learning View

Under 2 minutes from signup to first lesson.
