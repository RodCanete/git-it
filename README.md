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

The authoritative curriculum is **[docs/GIT it! Course Curriculum.pdf](docs/GIT%20it!%20Course%20Curriculum.pdf)** (Team Code: 2526-sem2-it332-34). The summary below matches that document. The app seeds a related but **not yet fully aligned** outline via `python manage.py seed_curriculum`; see [Implementation status](#implementation-status).

### How scenarios are structured

Teachable modules (1-4) use two **independent** axes:

| Axis | What it controls |
|------|------------------|
| **Levels** (Easy, Medium, Hard) | Scaffolding: how much support while working through the current template |
| **Variation pool** | Five fully-authored templates per scenario (narrative + fixed repo topology); rotates on retry |

| Level | Scaffolding available | Effect |
|-------|----------------------|--------|
| Easy | Live DAG + Expected-State diagram + contextual feedback on wrong commands | Target visible; mistakes explained (correct command never given) |
| Medium | Live DAG + Expected-State diagram | Target visible; no feedback on wrong commands |
| Hard | Live DAG only | Student reads raw repo state without structural guidance |

- **Fading rule:** Easy, then Medium, then Hard unlock **per scenario** (finishing scenario 1-2 does not gate 1-3).
- **Templates:** Five per scenario; on retry the system draws a different template (non-repeating within a session when possible).
- **Hints (all levels, on demand):** Three tiers (conceptual framing, directional narrowing, command-level guidance without the exact answer); usage is logged per step.

**Totals:** 19 scenarios, 57 level instances, **285** template-level combinations (19 x 3 levels x 5 templates).

### Module overview

| Module | Title | Scenarios | Levels each | Templates each | Level instances |
|--------|--------|-----------|-------------|----------------|-----------------|
| **0** | Pre-Module: Mental Model Orientation | (walkthrough only) | - | - | - |
| **1** | Local Foundations | 5 | 3 | 5 | 15 |
| **2** | Branching and Parallel Work | 5 | 3 | 5 | 15 |
| **3** | Collaboration and Conflict | 5 | 3 | 5 | 15 |
| **4** | Recovery and Repair | 4 | 3 | 5 | 12 |
| | **Total** | **19** | | | **57** (285 with templates) |

### Module 0 - Pre-Module: Mental Model Orientation

No scenarios, terminal, variation pool, or grading. Three orientation topics build mental models before Module 1. Short exit-check questions (not graded) gate progression.

| Topic | What it covers | Format |
|-------|----------------|--------|
| **0-A: What Is a Repository?** | Repo as folder with memory; working tree, staging area, commit history; snapshots; commit, tree, and blob objects | Animated click-through walkthrough |
| **0-B: What Does Git Actually Track?** | Snapshots vs diffs; tracked vs untracked; file lifecycle; how git add works; role of .git | Visual quiz (label file states from a snapshot) |
| **0-C: What HEAD Is** | HEAD as a pointer; branch pointers; how HEAD moves; detached HEAD preview | Animated DAG (observation only) |

### Module 1 - Local Foundations

*Assumption:* complete beginner. *Goal:* manage a personal repository confidently before collaboration.

| # | Scenario | Key Git commands | Learning outcome |
|---|----------|------------------|------------------|
| **1-1** | Initialize and Clone | git init, git clone, git status, git log, git branch -a | Initialize or clone a repo and fully audit its state |
| **1-2** | Staging and Committing | git add, git add -p, git restore --staged, git reset HEAD, git commit | Stage only intended changes; fix a runaway git add .; split logical commits |
| **1-3** | Viewing History | git log, git log --oneline, git diff, git diff --staged, git show, git log -S | Read staged/unstaged state and trace what changed in a commit |
| **1-4** | Pushing and Pulling (Solo) | git push, git pull, git fetch, git log --graph | Push local commits and pull remote updates with no conflicts |
| **1-5** | Understanding git status | git status, git add, git restore, git pull, git push | Interpret every git status output and take the correct action |

### Module 2 - Branching and Parallel Work

*Assumption:* Module 1 complete. *Goal:* branches as independent lines of work; safe navigation between them.

| # | Scenario | Key Git commands | Learning outcome |
|---|----------|------------------|------------------|
| **2-1** | Creating and Switching Branches | git branch, git switch -c, git checkout -b, git log --all --graph | Create named branches and switch without losing work |
| **2-2** | Branch Naming and Hygiene | git branch -m, git branch -d, git branch --merged, git branch --no-merged, git remote prune | Manage branch lifecycle and naming |
| **2-3** | Merging a Clean Branch | git merge, git log --graph, git branch --merged | Merge a feature into main cleanly; verify merge type from the DAG |
| **2-4** | Deleting Stale Branches | git branch -d, git branch -D, git branch --merged, git branch --no-merged | Delete only branches that are safe to remove |
| **2-5** | Wrong Branch Push | git reset, git cherry-pick, git checkout -b, git branch | Move feature work off main onto the correct branch |

### Module 3 - Collaboration and Conflict

*Assumption:* Module 2 complete. *Goal:* work in a shared codebase; read conflict markers; resolve without destroying teammates' work.

| # | Scenario | Key Git commands | Learning outcome |
|---|----------|------------------|------------------|
| **3-1** | What Causes a Merge Conflict | git merge, conflict markers, git status, git diff | Read markers and identify which lines belong to which contributor |
| **3-2** | Manual Conflict Resolution | git merge, conflict markers, git add, git commit | Resolve markers per file strategy and complete the merge commit |
| **3-3** | git fetch vs. git pull | git fetch, git pull, git log HEAD..origin, git merge, git stash | Use fetch-first workflow; recover from git pull with uncommitted local changes |
| **3-4** | Recovering from a Rejected Push | git fetch, git rebase, git push, git log --oneline | Diagnose a rejected push, rebase onto remote, push successfully |
| **3-5** | Fast-Forward vs. Three-Way Merge Decision | git merge, git rebase -i, git log --graph, git log --oneline | Read the DAG, choose merge type, squash WIP commits before merging |

### Module 4 - Recovery and Repair

*Assumption:* Module 3 complete. *Goal:* recover from destructive errors using git reflog and safe rebasing. Scenario **4-4** is the capstone synthesizing prior modules.

| # | Scenario | Key Git commands | Learning outcome |
|---|----------|------------------|------------------|
| **4-1** | Reading git reflog | git reflog, git checkout, git branch, git reset --hard | Locate commits no longer reachable from branch pointers |
| **4-2** | Accidental git reset --hard | git reflog, git reset --hard <hash>, git branch | Recover commits lost to an accidental hard reset |
| **4-3** | Understanding Diverged History | git log --oneline, git log --graph --all, git fetch, git log HEAD..origin | Read a diverged graph, find the common ancestor, choose integration strategy |
| **4-4** | Diverged History Recovery (Capstone) | git rebase, git push --force-with-lease, conflict markers, git reflog | Rebase onto updated remote, resolve conflicts, push safely |

### Implementation status

The platform implements the **level** and **template-rotation** model from the curriculum document. Content in the database may still use older module and scenario names until seed_curriculum is updated to match the PDF.

| Area | Curriculum PDF | App (seed_curriculum.py) today |
|------|----------------|----------------------------------|
| Module 1-4 titles | As in tables above | Different titles (e.g. Local Recovery, Merging and Remotes, Undoing Pushed Work) |
| Scenario count | 19 | 20 scenarios (different grouping) |
| Module 0 | Three orientation topics | Orientation module shell only |
| Templates per scenario | 5 fully authored | Often 1 template per scenario (placeholders for most) |
| Remote commands | Required from Module 1-4 onward | Simulator blocks push / pull / etch (planned: simulated remote) |

Fully authored seed templates today include **First Commit**, **Creating and Switching Branches**, and **Wrong Branch Commit** (legacy names). Expand and rename via Django admin or by updating the seed command to match the PDF.


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
