# CIQ Brain — Mockup

A design prototype for a **Brain-like reasoning, memory, and learning layer** on top of the CommerceIQ agent platform. Two surfaces, one substrate:

- **Customer app** — calm briefing inbox for CPG analysts and execs (3 tabs: Briefing · Ask · Actions)
- **Admin portal** — the control plane for PM / CS / FDE / data team across all 6 Brain layers (Memory, Composer, Skill Studio, Orchestrate, Outcomes, Adapt)

The Brain's complexity stays behind the scenes; the analyst sees one calm page with answers and trackable recommendations.

> **🔗 Live demo:** [mshadaab27.github.io/commerceiq-brain](https://mshadaab27.github.io/commerceiq-brain/)

---

## What's in here

A pure-static HTML/CSS/JS app. No build step, no framework, no backend. Open `index.html` in any browser.

```
brain_mockup/
├── index.html             # Customer · Today's Briefing (landing page)
├── ask.html               # Customer · Open chat / Ask anything
├── actions.html           # Customer · Outcome tracker (your fixes)
├── alert.html             # Customer · Alert deep-dive (?id=<ASIN>)
├── admin/
│   ├── index.html         # Admin · Overview gateway
│   ├── memory.html        # L1 · Causal graph + episodic + procedural + context
│   ├── composer.html      # L2 · NL → use case 3-step wizard
│   ├── studio.html        # L2 · Visual DAG editor for skills
│   ├── orchestrate.html   # L3 · Router decisions + novel-question mining
│   ├── outcomes.html      # L5 · Action log + methodology audit
│   └── adapt.html         # L6 · Learning loops + pending review queue
└── assets/
    ├── styles.css         # Single design system (~625 lines)
    ├── data.js            # Real SharkNinja dataset (alerts, conversations, actions)
    ├── render.js          # Page renderers (Briefing / Alert / Ask / Actions)
    └── app.js             # Interactions (modals, tabs, toasts, wizard)
```

## How it works

### The customer side (calm)

**Briefing** is a scannable inbox ranked by impact. One alert pre-expanded inline with the recommended action and a `Mark as fixed & track` button. The Brain's intelligence shows up as inline pills only when it changes the answer:

- *"same pattern flagged 14d ago"* (episodic recall)
- *"your fix is working: +9.2% so far"* (outcome loop)
- *"repeat pattern, 3× this quarter"* (memory surfacing)

**Ask** renders suggestions + recent conversations. Clicking a conversation opens its thread inline. ASIN-style questions route directly to the alert deep-dive.

**Actions** is the outcome tracker — in-flight measurements vs. a synthetic baseline, with lift sparklines.

### The admin side (dense)

A sidebar with the 6 Brain layers, badges showing each layer's count, and per-page operator UIs:

| Layer | Page | What it does |
|---|---|---|
| L1 | `memory.html` | Visualize the causal graph, browse episodic traces, audit procedural rules + tenant context |
| L2 | `composer.html` | NL → use case wizard: describe → review SQL + constraints → scope & publish |
| L2 | `studio.html` | Drag-and-drop DAG editor to compose skills from tools + use cases |
| L3 | `orchestrate.html` | Router decision feed, novel-question mining, replay config |
| L5 | `outcomes.html` | Action log across tenants, donor-pool methodology audit, belief Δ column |
| L6 | `adapt.html` | 6 learning loops, pending review queue, canary status |

L4 (Execution) is the existing agent platform underneath; not a separate page.

## Real navigation, real data

- Briefing → Alert is real routing via `alert.html?id=<ASIN>`
- `Mark as fixed & track` writes to `sessionStorage` so the Actions strip on Briefing reflects newly tracked items
- Filter chip state persists across navigation
- Ask chat threads route via `ask.html?thread=<id>`
- ASIN-typed in any input is detected and routed to the matching alert
- Data in `assets/data.js` was scraped from the live SharkNinja agent UI: 6 real SKUs (NC301, NC701, NC501, PG305, PG301BL, HD440) with real ASINs, gaps, RCA trees, and narratives

## Run locally

Open `index.html` in any browser. That's it.

If you want a tiny local server (recommended for sessionStorage and clean relative-link resolution):

```bash
cd brain_mockup
python3 -m http.server 8000
# then open http://localhost:8000
```

## Design system

Follows the existing CommerceIQ aesthetic:

- Typography: `ProximaNova`, falls back to `Inter`
- Single accent: electric purple `#C231FF` (org brand) reserved for primary actions and AI signals
- Negatives: magenta `#D43A6A`; positives: forest `#0F9F6E`
- Two surfaces, one CSS file:
  - `.surface-customer` — white, generous whitespace, scannable
  - `.surface-admin` — dense grids, sidebar nav, mono font for IDs / SQL / code

## Status

This is a **design prototype**. No backend, no real agent. The intent is to show:

1. How a Brain-like AI control plane could sit above the existing agent platform
2. How the customer-facing UI stays calm and uncluttered while exposing exactly enough Brain intelligence to be trusted
3. How internal authoring (Composer, Studio) lets PM / CS / FDE roles add use cases without engineering involvement
4. How outcome tracking closes the feedback loop that makes the Brain learn
