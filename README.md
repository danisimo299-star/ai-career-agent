# AI Career Agent

A long-term AI career assistant: it learns about the user through
conversation, then recommends professions, builds a roadmap, generates an
ATS-friendly resume, runs mock interviews, and surfaces matching job
listings.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture writeup
and [TODO.md](./TODO.md) for the feature build order.

## Stack

Next.js 16 (App Router) · TypeScript · TailwindCSS v4 · shadcn/ui · Prisma
6 · PostgreSQL · NextAuth (Auth.js) v5 · Zod · react-hook-form · motion ·
next-themes · a hand-rolled RU/EN i18n layer

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run db:push        # sync the Prisma schema to your database
npm run dev
```

Open http://localhost:3000.

No AI or job-board API key is required to run the app locally —
`AI_PROVIDER` and `JOBS_PROVIDER` default to `mock` (see
`src/lib/ai/provider.ts` and `src/lib/jobs/provider.ts`).

**Dev environment note:** this repo currently lives inside a
OneDrive-synced folder (`...\OneDrive\Desktop\ai-career-agent2`). OneDrive
doesn't respect `.gitignore`, so it continuously scans/syncs `node_modules`
and `.next` — this has caused at least one transient `EPERM`/file-lock
error during a Prisma client rebuild (resolved by retrying). It doesn't
block development, but if file-lock errors during `npm run build` /
`prisma generate` become frequent, move the repo to a non-synced path like
`C:\Projects\ai-career-agent` rather than trying to fix it from application
code — there's nothing in the codebase that can address it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push `prisma/schema.prisma` to the database (no migration files — good for early development) |
| `npm run db:migrate` | Create a versioned migration (switch to this once the schema stabilizes) |
| `npm run db:studio` | Prisma Studio, a GUI for the database |
| `npm run db:seed` | Run `prisma/seed.ts` |

## Project status

Fully working today: registration, login, logout, protected routes, the
bilingual (RU/EN) UI with automatic browser-language detection, dark/light
theme, the 7-step onboarding wizard, an AI chat that conducts a real
10-topic career interview, Career Analysis (top 5 profession matches),
Career DNA, Career Score, the Career Passport page, a database-backed
Weekly Missions system, the **Career Roadmap** module (`/dashboard/roadmap`)
— AI-generated milestones with tasks and (never-fabricated, verified-or-marked-unverified)
learning resources, sequential unlocking, real persisted progress, a
career-goal picker, and "Regenerate Roadmap" with confirmation — and
**Career Missions** (`/dashboard/missions`) — a daily AI-generated primary +
2-4 secondary mission set driven by the Roadmap's current milestone and
skill gaps, with Start/Complete/Skip/Regenerate, a real completed-mission
streak, and completion that updates the linked roadmap task, milestone and
overall progress, and Career Score through the same logic those already
use (not a second scoring system) — the **Resume Builder**
(`/dashboard/resume`) — a real editor (personal info, objective, summary,
experience, education, projects, skills, languages, certificates, each
add/edit/delete) with per-section AI assist that only ever suggests text
from facts the user already entered (never fabricated work history), a
deterministic ATS-style Resume Score with actionable recommendations, 3
real templates (Modern/Professional/Minimal) with a live preview, and
actual PDF export — and the **Interview Simulator**
(`/dashboard/interview`) — a real adaptive mock interview (General/
Technical/Behavioral/HR/Mixed/Resume-based, 3 difficulty levels, 5/10/15 questions,
personalized from profile/résumé/roadmap skills) that asks one question at
a time, evaluates each answer with a 7-criteria breakdown and occasional
AI-offered follow-up, and ends in a full score report with a
question-by-question review, history, and real progress stats — and
**Job Matching** (`/dashboard/jobs`) — city-first real vacancy discovery:
profession + a quick-select of 11 real Russian cities (or Remote, or any
other city typed by hand) with format/experience/employment/salary/
internship filters and sorting, an AI Job Search Assistant (free text
turned into validated structured filters, never a direct query), a
deterministic rule-based matching engine (skills/experience/location/
career-goal/salary — never an LLM guess), a "Prepare for this job" AI plan
(resume tips, HR/technical questions), Resume Match, real Saved Jobs + an
Application Tracker, and a "Prepare for Interview" button that starts a
genuine vacancy-specific Interview Simulator session — plus "Find jobs"
deep links straight from Career Analysis and the Roadmap. HH.ru's public
API was live-tested before building this: vacancy search currently
requires a registered app's OAuth token — without one (`HH_ACCESS_TOKEN`
unset), every listing is clearly labeled "Demo listing (not a real
vacancy)" and its button honestly reads "Search on HH.ru" rather than
"Open vacancy," and still always links out through a genuine,
correctly-parameterized `hh.ru/search/vacancy` URL (validated against the
hh.ru domain and http/https-only) rather than any fabricated listing.
Salary is shown exactly as the source reports it (от/до/range/по
договорённости), never estimated — and the **AI Career Coach**
(`/dashboard/coach`) — ties every module above into one place that
answers "what should I do next?": a conversational Chat tab grounded in a
compact snapshot of real facts (never a raw profile dump, and never
re-asking what it already knows), an Overview tab with "AI Career
Readiness" (a clearly-labeled, non-"scientific" composite of Career Fit/
Skill Readiness/Resume Quality/Interview Readiness/Job Match/Application
Progress, each pulled from a real existing score and left out — not
faked — when there's no data yet) plus real application analytics, a
Skill Gap tab comparing the user against both a target profession's
typical requirements *and* real requirements aggregated across actually
searched vacancies (critical/high/medium/low priority by real frequency,
never invented), a My Plan tab (the existing Roadmap reprojected
month-by-month), and a Compare Careers tab (deterministic side-by-side
comparison of 2-4 professions, never forcing one single "correct" answer).
All scoring is deterministic (`lib/career/{skill-gap,readiness,
application-analytics,career-plan,career-scenarios}.ts`); the AI only
classifies intent and writes the reply, never the suggested-action links.
All of it runs against `AI_PROVIDER=mock` / `JOBS_PROVIDER=mock` by
default — no API key needed — via `MockCareerService` and
`MockJobsProvider`, deterministic stand-ins the rest of the app can't tell
apart from real ones.

A design-system/consumer-UX pass replaced the app's originally-unmodified
grayscale shadcn theme with a real indigo accent (light + dark, registered
as `success`/`warning` semantic tokens too) that re-skinned the whole
product through already-shared components; rebuilt the dashboard around
"where am I / where can I go / what should I do next" (career goal,
plain-language readiness, a next-best-action card with a real reason, and
a 6-step journey checklist); turned the AI Career Coach's empty chat state
into a personalized greeting with quick-suggestion buttons; and simplified
several technical labels ("Skill Gap Analysis" → "What you're missing,"
etc.) while keeping the technical term as secondary text, not removing it.

See [TODO.md](./TODO.md) for what's left — mostly cross-cutting polish,
a deeper UX pass on the remaining screens, and optional real-provider
credentials, not missing features.
