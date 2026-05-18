# GIT it!

**GIT it!** is an interactive Git learning platform that teaches version control through hands-on scenarios—not slide decks or static tutorials. Students work in a browser-based terminal against a simulated repository, watch the commit graph update in real time, and receive adaptive scaffolding that fades as they improve.

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
  - [Authentication & roles](#authentication--roles)
  - [Dashboard & learning path](#dashboard--learning-path)
  - [Scenario workspace](#scenario-workspace)
  - [In-browser Git simulator](#in-browser-git-simulator)
  - [DAG visualization](#dag-visualization)
  - [Fading scaffolding & difficulty tiers](#fading-scaffolding--difficulty-tiers)
  - [Session tracking & grading](#session-tracking--grading)
  - [Progress & completion](#progress--completion)
  - [Admin dashboard](#admin-dashboard)
  - [Curriculum management](#curriculum-management)
- [Curriculum](#curriculum)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Project structure](#project-structure)

---

## Overview

Each lesson is a **scenario**: a narrative problem (for example, “you committed to the wrong branch”) with a defined **initial repository state** and **target state**. Students type real `git` commands in a terminal; the app replays history into an in-memory repo using [isomorphic-git](https://isomorphic-git.org/) and checks whether the live state matches the goal.

Success is measured on two axes:

1. **Target achieved** — refs, commits, and branch topology match the scenario’s target state (including flexible matchers like `__any__` for commit messages).
2. **Command efficiency** — requires reaching the target within the scenario’s **minimum command count**; 

A **hard cap** on commands ends the session automatically if the student runs out of attempts.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, Vite, React Router, TanStack Query, Zustand, Axios |
| **Git runtime** | isomorphic-git, Lightning FS (in-memory filesystem) |
| **Backend** | Django 6, Django REST Framework, Simple JWT |
| **Database** | SQLite (local dev) or PostgreSQL via Supabase (`SUPABASE_DATABASE_URL`) |
| **Auth** | Email-based users, JWT access + refresh tokens |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React SPA (localhost:5173)                                     │
│  · Auth, Dashboard, Workspace, Completion, Admin                │
│  · isomorphic-git simulator + DAG renderer                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST /api  (JWT Bearer)
┌───────────────────────────▼─────────────────────────────────────┐
│  Django API (localhost:8000)                                    │
│  accounts · curriculum · progress · admin_api                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              SQLite  or  PostgreSQL (Supabase)
```

- **Frontend** talks to `http://localhost:8000/api` and refreshes expired access tokens automatically.
- **Backend** owns users, curriculum content, per-scenario progress, sessions, and command logs.
- **Git execution** happens entirely in the browser; the server stores outcomes and analytics, not live repos.

---

## Features

### Authentication & roles

- **Register** with email, username, password, and role (`student` or `admin`).
- **Sign in** with email + password; receive JWT **access** (15 minutes) and **refresh** (7 days) tokens.
- **Protected routes**: unauthenticated users are redirected to `/login`.
- **Role-based access**: only `admin` users can open `/admin`; students are redirected to the dashboard.

### Dashboard & learning path

- **Module browser**: curriculum is grouped into ordered modules, each with a color, icon, and expandable scenario list.
- **Scenario launch**: click any scenario to open the workspace at `/workspace/:scenarioId`.
- **Stats strip** (per user):
  - **Command accuracy** — pass sessions / total graded sessions (`pass` + `miss`).
  - **Total sessions** and **pass sessions**.
  - **Scenario count** across all modules.

### Scenario workspace

The workspace is the core learning environment:

| Area | Purpose |
|------|---------|
| **Header** | Module/scenario title, difficulty tier switcher, panel toggles, command limit meter, Retry / Reset / Dashboard |
| **Sidebar** | Scenario narrative, tier progress, scaffold banners, optional **consequence feedback** |
| **Center** | **Live DAG** (current repo) and/or **Target DAG** (goal state), toggled per difficulty |
| **Terminal** | Command history and input; runs against the in-browser simulator |

**Panel visibility by tier** (fading scaffolding):

| Tier | Live DAG | Target DAG | Consequence feedback |
|------|----------|------------|----------------------|
| Easy | ✓ | ✓ | ✓ |
| Medium | ✓ | ✓ | ✗ |
| Hard | ✓ | ✗ | ✗ |

- **Reset** — replay the same template from `initial_state` and start a new session.
- **Retry** — manually advance to the next scenario **variant** (same rules as failing twice on one variant).
- **Loading screen** — brief branded transition when entering a scenario.

### In-browser Git simulator

Commands run against an isolated in-memory repo per session. Supported commands include:

- `git init`, `git status`, `git log`, `git branch` (list and create/delete)
- `git add` (file or `.`)
- `git commit -m "message"`
- `git checkout` / `git switch` (including `-b` / `-c` for new branches)
- `git merge <branch>`


**Initial state replay** builds commit history, branches, and `HEAD` from JSON defined on each `ScenarioTemplate`. **Target checking** compares live refs and commits to the template’s `target_state`, with special placeholders:

- `__any__` — any commit / ref tip is acceptable
- `__any_with_login__` — tip commit message must contain “login”

### DAG visualization

- **Live panel** — renders the current commit graph (commits, branches, `HEAD`) with lane colors and compact layout.
- **Target panel** — shows the goal topology; abstract target commits are synthesized for display when hashes are omitted.
- Graph updates after every successful command.

### Fading scaffolding & difficulty tiers

Each scenario is mastered across three **tiers**: **Easy → Medium → Hard**.

- **Easy** is always available.
- **Medium** unlocks after completing Easy; **Hard** after Medium.
- Completing **all three tiers** marks the scenario complete and can route to the completion screen with `allTiersComplete`.

**Variants**: scenarios can define multiple `ScenarioTemplate` rows (`template_index` 1–5). On repeated failure:

1. **First miss** on a variant — **reset same** template; feedback panel may open on Easy.
2. **Second miss** — **rotate** to the next variant.
3. After all variants are exhausted — **hint restart** (hint mode on; message to review the lesson overview).

**Hint mode** is surfaced in the sidebar and scaffold banner (variant label, attempt “1 of 2”, instructional messages).

Passing a tier unlocks the next tier and loads the appropriate template for that difficulty.

### Session tracking & grading

Every workspace visit creates a **Session** linked to user, scenario, and template.

- Each command is logged in **CommandLog** with `was_valid` (whether the simulator accepted it).
- Ending a session sends `commands_used`, `target_achieved`, `terminated_by_cap`, and `difficulty_tier`.
- **Result**:
  - `pass` — target achieved **and** `commands_used ≤ min_commands`
  - `miss` — otherwise (including target reached but too many commands)
  - `abandoned` — available on the model for future use

The API response includes a **scaffold** payload (`action`, `message`, `tier_progress`, etc.) that drives the workspace UI (retry, tier unlock, variant rotation, scenario complete).

### Progress & completion

- **UserProgress** — aggregate command accuracy and session counts (recomputed after each graded session).
- **ScenarioProgress** — per-scenario attempts, last template used, tier completion flags, variant attempt counter, hint cycle state.
- **Completion screen** (`/completion`) — stars (1–3) based on how close command count was to minimum, PASS/MISS summary, commands used vs minimum, navigation back to dashboard or retry.

### Admin dashboard

Admins (`role=admin`) get a **Platform Overview** at `/admin`:

| Widget | Data |
|--------|------|
| **Stat cards** | Total students, average command accuracy, total sessions, platform pass rate |
| **Students table** | Username, email, accuracy %, session count |
| **Top incorrect commands** | Most frequent invalid/failed commands across all students (top 20) |

Additional API support exists for **per-student session history** (last 20 sessions) via the student detail endpoint.

### Curriculum management

- **Django admin** at `/django-admin/` for Modules, Scenarios, and ScenarioTemplates.
- **Seed command** — `python manage.py seed_curriculum` creates modules, scenarios, and templates (full definitions for some scenarios; placeholders for others until an admin fills them in).

Each **ScenarioTemplate** stores:

- `narrative` — story shown in the sidebar  
- `initial_state` / `target_state` — JSON repo snapshots  
- `min_commands` — optimal command count for a pass  
- `hard_cap` — maximum commands before forced session end  

---

## Curriculum

Five modules, **20 scenarios** (specific objectives aligned with a structured Git syllabus):

| Module | Focus | Scenarios |
|--------|--------|-----------|
| **0 — Orientation** | Introduction | (module shell; scenarios may be added) |
| **1 — Local Foundations** | Everyday local Git | First Commit (SO 1.1), Wrong Branch Commit (1.2), Partial Staging (1.3), Detached HEAD (1.4), Branch Cleanup (1.5), Creating and Switching Branches (1.6) |
| **2 — Local Recovery** | Fixing mistakes locally | Amend Last Commit (2.1), Soft Reset (2.2), Hard Reset (2.3), Restore a File (2.4), Stash & Switch (2.5) |
| **3 — Merging & Remotes** | Integration & remotes | Fast-Forward Merge (3.1), Merge Conflict (3.2), Rebase Onto Main (3.3), Rejected Push (3.4), Fetch & Integrate (3.5) |
| **4 — Undoing Pushed Work** | Shared-history safety | Revert a Pushed Commit (4.1), Force Push Recovery (4.2), Lost Commit Recovery (4.3), Repository Recovery (4.4) |

Fully authored templates in the seed data today include **First Commit**, **Creating and Switching Branches**, and **Wrong Branch Commit**; other scenarios ship with placeholder states editable in Django admin.

---

## API reference

Base URL: `http://localhost:8000/api`  
Authenticated endpoints require `Authorization: Bearer <access_token>` unless noted.

### Auth (`/api/auth/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `register/` | Create account (public) |
| POST | `token/` | Obtain access + refresh tokens (public) |
| POST | `token/refresh/` | Refresh access token (public) |

### Curriculum

| Method | Path | Description |
|--------|------|-------------|
| GET | `modules/` | List modules with nested scenarios |
| GET | `scenarios/<id>/` | Scenario detail + templates |
| GET | `scenarios/<id>/next-template/?difficulty=` | Current template + scaffold metadata |
| POST | `scenarios/<id>/advance-variant/` | Manual variant advance (retry) |

### Progress

| Method | Path | Description |
|--------|------|-------------|
| GET | `progress/` | User-level accuracy and session stats |
| POST | `sessions/` | Start a session |
| PATCH | `sessions/<id>/` | End session; returns `scaffold` instructions |
| POST | `sessions/<id>/commands/` | Log a command |

### Admin (`/api/admin/`, admin role only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `stats/` | Platform aggregates |
| GET | `students/` | Student list with progress |
| GET | `students/<id>/` | Student detail + recent sessions |
| GET | `commands/incorrect/` | Top incorrect commands |

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) PostgreSQL connection string for Supabase

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (optional):

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
# SUPABASE_DATABASE_URL=postgresql://...   # omit to use SQLite
```

```bash
python manage.py migrate
python manage.py seed_curriculum
python manage.py createsuperuser   # optional, for Django admin
python manage.py runserver
```

API: `http://localhost:8000/api`  
Django admin: `http://localhost:8000/django-admin/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

Ensure the backend is running so auth and curriculum requests succeed.

### Production build

```bash
cd frontend
npm run build
npm run preview
```

---

## Project structure

```
git-it/
├── backend/
│   ├── accounts/          # Custom User (email login, student/admin roles)
│   ├── curriculum/        # Modules, Scenarios, ScenarioTemplates + seed command
│   ├── progress/          # Sessions, CommandLogs, scaffolding logic
│   ├── admin_api/         # Admin-only analytics endpoints
│   └── gitit_backend/     # Django settings, root URLs
├── frontend/
│   └── src/
│       ├── screens/       # Auth, Dashboard, Workspace, Completion, Admin
│       ├── components/    # UI, DAG renderer, workspace panels
│       ├── hooks/         # useGitEngine, useSession, useAuth
│       ├── api/           # Axios client + query helpers
│       └── lib/           # gitFs, repoConsequence
└── README.md
```

---

## License

See repository license file if present; otherwise treat as project-internal until specified.
