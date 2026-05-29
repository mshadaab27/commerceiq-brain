# CIQ BRAIN — Architecture & Design

> A reasoning, memory, and learning layer that sits on top of the existing CommerceIQ agent platform and turns it from a playbook executor into a system that gets smarter every day, can be authored by non-engineers, and closes the loop between recommendation → action → outcome → updated belief.

**Companion mockup:** [mshadaab27.github.io/commerceiq-brain](https://mshadaab27.github.io/commerceiq-brain/)

---

## Table of contents

1. [The one-paragraph version](#1-the-one-paragraph-version)
2. [Why BRAIN](#2-why-brain)
3. [The six layers](#3-the-six-layers)
4. [The two surfaces](#4-the-two-surfaces)
5. [A request's journey through BRAIN](#5-a-requests-journey-through-brain)
6. [The outcome loop — what makes BRAIN learn](#6-the-outcome-loop--what-makes-brain-learn)
7. [Authoring model — who creates what](#7-authoring-model--who-creates-what)
8. [Multi-tenant, multi-product, personalized](#8-multi-tenant-multi-product-personalized)
9. [How BRAIN integrates with the existing platform](#9-how-brain-integrates-with-the-existing-platform)
10. [Personas and what they see](#10-personas-and-what-they-see)
11. [Mockup reference — where to explore each idea](#11-mockup-reference--where-to-explore-each-idea)
12. [Suggested rollout phases](#12-suggested-rollout-phases)
13. [Open questions](#13-open-questions)
14. [Appendix · Data shapes](#14-appendix--data-shapes)

---

## 1. The one-paragraph version

Today, the CommerceIQ agent platform answers questions by matching them to a hand-coded playbook (a "use case"), running the use case's SQL, and formatting the result with hand-coded constraint rules. Engineers seed the playbooks, the constraints, and the SQL templates. The agent has no memory of past investigations, no awareness of whether its recommendations actually worked, and no way for non-engineers to add new use cases without a PR. **BRAIN changes all of that.** It's a new layer that sits *above* the existing agents and does six things: it remembers, it routes, it lets PMs author new use cases in natural language, it tracks the impact of every accepted recommendation against a synthetic baseline, it updates its own beliefs from those outcomes, and it personalizes per tenant and per user — all while keeping the customer-facing UI a calm, single-purpose briefing inbox.

---

## 2. Why BRAIN

### 2.1 What the current platform does well

- **Deterministic answers.** Constraint rules + SQL templates produce reliable, auditable analyses.
- **Tenant isolation.** Per-client scoping is enforced throughout (use cases, constraints, caching).
- **Composable.** The deepagents framework already supports tools, skills, middleware, and structured output.
- **Operational maturity.** Caching, tracing, query-planner, checkpointer, session-store — all already in production.

### 2.2 What it doesn't do (yet)

| Gap | Symptom |
|---|---|
| **No long-term memory** | Same question gets re-asked weekly and starts cold every time. Past investigations and their outcomes aren't reused. |
| **No learning** | A bad factor priority stays bad until an engineer notices. A good recommendation that never gets validated stays unproven. |
| **No outcome loop** | The agent says "fix the deal badge" — nobody knows if the customer fixed it or if it worked. |
| **High authoring cost** | Every new use case = engineering PR, seed script change, deploy. PMs cannot ship business knowledge directly. |
| **No cross-agent orchestration** | Each agent has its own router prompt. A question that needs RCA + query-planner + viz requires human glue. |
| **No personalization** | Every CSM sees the same factor ordering even though they care about different signals. |
| **No product-line scale** | Adding DSA, MAP, RMM, RGM to the same Brain means duplicating use cases per product, not composing them. |

### 2.3 What BRAIN adds

A new layer that **wraps** the existing platform (doesn't replace it) and adds:

1. **Causal + episodic + procedural memory** with provenance and tenant scope
2. **A meta-router** that decides which agent(s) + use case(s) answer a question
3. **A natural-language authoring loop** so PM/CS/FDE can publish new use cases without engineering
4. **An outcome tracker** that measures every accepted recommendation against a synthetic baseline
5. **Closed-loop learning** that updates factor weights, constraint priorities, and routing from real outcomes
6. **Multi-scope personalization** (global → product → client → user → thread) with deterministic precedence

---

## 3. The six layers

```
┌───────────────────────────────────────────────────────────────────────┐
│  L6 │ ADAPTATION         (rules that rewrite L1/L2 from L5 signals)  │
├───────────────────────────────────────────────────────────────────────┤
│  L5 │ OUTCOME TRACKING   (action log → impact measurement → beliefs) │
├───────────────────────────────────────────────────────────────────────┤
│  L4 │ EXECUTION ENGINE   (existing platform — agents, MCP, SQL)      │
│     │                    Amazon RCA · QueryPlanner · Viz · ExecSumm  │
├───────────────────────────────────────────────────────────────────────┤
│  L3 │ META-ORCHESTRATION (Router / Planner / Skill Composer)         │
├───────────────────────────────────────────────────────────────────────┤
│  L2 │ KNOWLEDGE AUTHORING (Composer · Skill Studio · Context Inject) │
│     │                     ← PM / CS / FDE / user input enters here   │
├───────────────────────────────────────────────────────────────────────┤
│  L1 │ KNOWLEDGE SUBSTRATE (Causal KG · Episodic · Procedural · Ctx)  │
└───────────────────────────────────────────────────────────────────────┘
```

Each layer is described below with its responsibilities, primary artifacts, and how it relates to the layer above and below.

### L1 — Knowledge Substrate (what BRAIN *knows*)

Four stores, hybrid symbolic + neural throughout. Symbolic side gives explainability, tenant isolation, learnable rules. Neural side gives flexibility for novel phrasings and cross-investigation surface.

| Store | Symbolic side | Neural side |
|---|---|---|
| **Causal knowledge graph** | Typed nodes (factors, signals, metrics, actions) and typed edges (`causes`, `precedes`, `correlates_with`) with learned `strength` + `confidence` per tenant scope | Vector embedding on each node for similarity retrieval |
| **Episodic memory** | Per-investigation row: question, hypotheses, evidence, conclusion, outcome | Question + conclusion embeddings for "we've seen this before" lookup |
| **Procedural memory** | Current `standard_rca_use_cases`, `constraint_rules`, `skills`, `tools`, SQL templates | LLM-readable summaries of each, for the Router to score relevance |
| **Context store** | Typed key-value: `tenant.prefers_factor_order`, `user.role=CSM`, `thread.investigating_sku=B0X` | Free-text business context with embeddings ("we launched a campaign May 15") |

**Why hybrid matters:** the symbolic side gives explainability, tenant isolation, learnable rules. The neural side handles novel phrasings and cross-investigation pattern matching.

**Mockup reference:** [`/admin/memory.html`](https://mshadaab27.github.io/commerceiq-brain/admin/memory.html) — 4-tab explorer.

### L2 — Knowledge Authoring (how knowledge gets *in* without engineers)

Three authoring surfaces. This is the biggest leverage point in the entire system: today a new use case is a code change + seed script + PR + deploy; with L2, a PM ships one in minutes.

#### ① The Composer — natural language → executable use case

```
PM types: "Flag SKUs whose organic rank dropped 5+ positions
           on a keyword we spent >$1K on last week"
                              ↓
   ┌─────────────────────────────────────────────────────┐
   │ Composer LLM with retrieval over:                         │
   │   • existing use cases / constraints / SQL templates       │
   │   • catalog of available metrics & dimensions              │
   │   • internal text-to-SQL tool (the existing query planner) │
   └─────────────────────────────────────────────────────┘
                              ↓
   Drafts:
     • use_case_key, description, triggers, notes
     • SQL template (lifted from query planner output)
     • Constraint rules: DATA / ANALYSIS / PRESENTATION
     • JSON output schema (when structured response needed)
                              ↓
   Auto-validates by running a sample query against Databricks
                              ↓
   Reviewer approves → published to: [global | product | client | user]
                              ↓
   Writes to:  standard_rca_use_cases + constraint_rules
               (the same tables today's agents already read)
```

The Composer *reuses* what's already in the codebase — the query planner already does NL→SQL. The Composer is "query planner + skill scaffolder + auto-validator wrapped in an authoring UI."

**Mockup:** [`/admin/composer.html`](https://mshadaab27.github.io/commerceiq-brain/admin/composer.html) — 3-step wizard.

#### ② Skill Studio — visual composition of tools into workflows

A DAG editor where PM/FDE assemble skills:

```
[ rca_for_sku ] ──┐
                  ├──► [ if factor=LBB ] ──► [ create_alert ]
[ lbb_lookup ]  ──┘                  │
                                    └──► [ recommend_action: "fix pricing" ]
                                              │
                                              └──► [ register_action_for_tracking ]
```

Maps onto the existing **Skill system** (`domain/skills/`) which already has manifest, version, tenant binding, asset_repo. The Studio is a UI on top of `SkillService.resolve_manifest()`. A skill becomes injectable into any agent's runtime via the existing `active_skill_bootstrap` middleware.

**Mockup:** [`/admin/studio.html`](https://mshadaab27.github.io/commerceiq-brain/admin/studio.html) — drag-drop DAG canvas.

#### ③ Context injection — business knowledge users paste in

Four layers of context BRAIN respects, with deterministic precedence (most specific wins):

| Scope | Authored by | Example | Persists |
|---|---|---|---|
| **Global** | Product team | "Always ignore SKUs with `is_test_product=true`" | Forever |
| **Tenant** | CS / FDE | "Acme launched a new campaign May 15 — expect inflated metrics through May 22" | Until expiry |
| **User** | End user | "I'm a CSM for Shark — default my questions to that brand" | Forever |
| **Thread** | End user | "For this conversation, focus only on Q2 vs Q1" | Until thread ends |

All four stored in `brain_context` with embeddings; injected into the system prompt by the Router based on relevance.

### L3 — Meta-Orchestration (the new control plane)

Today the Amazon RCA agent's system prompt does its own routing via "Step 1: get_rca_use_cases → Step 2: match." This works for one agent. It doesn't scale across the platform.

**Replace it with a Router agent that sits *in front of every conversation*:**

```
                              User question
                                    ↓
            ┌──────────────────────────────────────────────────┐
            │           BRAIN ROUTER (lightweight LLM)            │
            │                                                     │
            │  Inputs:                                            │
            │   • user question                                   │
            │   • thread history                                  │
            │   • L1 episodic memory (similar past questions)     │
            │   • L1 procedural inventory (all use cases all agts) │
            │   • L1 user/tenant/thread context                   │
            │   • L1 KG (recent anomalies for this client/SKU)    │
            │                                                     │
            │  Decides:                                           │
            │   1. Direct route   → one agent, one use case       │
            │   2. Investigation  → DAG of multiple agents        │
            │   3. Clarify        → ask user question             │
            │   4. Novel          → log for Composer mining       │
            │   5. Replay         → return cached past investigtn │
            └───────────────────────────────────────────────────┘
                                    ↓
                          ┌─ amazon_rca_agent
                          ├─ query_planner
                          ├─ rca_chat
                          ├─ executive_summary_agent
                          ├─ visualisation_agent
                          ├─ planner_agent
                          └─ … (any future agent)
```

**Key behaviors:**

- **Cross-agent investigation plans.** If a question spans RCA + viz + summary, Router builds a DAG and stitches outputs.
- **Episodic replay.** If the same client asked the same question 2 weeks ago and the conclusion is still valid (no upstream data refresh), return the cached investigation with a recall banner — saves Databricks $$ + latency.
- **Novel-question mining.** Every question the Router can't confidently route is logged. Once N similar novel questions arrive, the Composer is auto-triggered to propose a new use case draft.
- **Confidence-aware.** Router returns a confidence score. Below threshold → forced clarifier. Above → silent execution.

**Where it lives:** a new top-level agent at `domain/deepagents/agents/brain_router/`, becoming the default agent for the `/invoke` endpoint when `workflow_type` isn't specified.

**Mockup:** [`/admin/orchestrate.html`](https://mshadaab27.github.io/commerceiq-brain/admin/orchestrate.html) — decision feed, novel mining, router config.

### L4 — Execution Engine (the existing agents — unchanged)

**This is the current platform.** Amazon RCA, Query Planner, Visualization, Executive Summary — all unchanged. BRAIN wraps them; nothing gets thrown away.

What *does* change: each agent invocation is now wrapped with telemetry that feeds L5 (Outcome tracking) and L6 (Adaptation). Agents emit structured `recommendation` blocks with predicted impact + dependent metrics + measurement window, which L5 picks up.

No separate mockup page — L4 is what the customer ends up seeing inside the Briefing and Alert pages.

### L5 — Outcome Tracking (the loop that makes BRAIN smarter)

The loop you described with the promo-badge example. Today the agent makes a recommendation, the customer fixes it, and **nobody ever measures whether it worked.** L5 fixes that.

#### Lifecycle of a tracked action

```
[1] Agent emits recommendation in structured output:
    {
      "recommendation": "Fix missing deal badge on B0DSJW8SFG",
      "trackable": true,
      "action_type": "FIX_PROMO_BADGE",
      "target_sku": "B0DSJW8SFG",
      "expected_impact": {
        "metric": "ops",
        "lift_pct_range": [8, 15],
        "window_days": 7,
        "dependent_signals": [
          "deal_badge_present",
          "glance_views",
          "conversion_rate"
        ]
      }
    }

[2] User clicks "Mark as fixed" in the UI
    (or external action-log integration auto-detects the fix)
            ↓
[3] INSERT brain_actions row:
        sku, action_type, taken_at, taken_by,
        baseline_metric_values = current week snapshot,
        expected_impact (copied from above)
            ↓
[4] Daily cron:
      FOR each open action where now - taken_at >= window_days:
        - pull metrics for SKU over window
        - compute counterfactual baseline:
            • synthetic control from similar SKUs in same sub-category
            • OR trailing 4-week average pre-action
        - measure lift_pct vs counterfactual
        - INSERT brain_outcomes row with conclusion enum
            ↓
[5] Outcome feeds back into L1 causal graph:
      brain_relations[(factor=deal_badge, metric=ops)]
        .evidence_n += 1
        .strength = bayesian_update(strength, observed_lift)
        .confidence ↑ (or ↓ if negative)
        .last_validated_at = now
            ↓
[6] Next time an RCA fires for ANY SKU, the updated weight in the KG
    changes the factor ordering — "Deal Visibility" might surface higher
    because we now know it moves OPS reliably for this client.
```

#### Counterfactual baseline (the hard part)

Three modes, pick by data availability:

| Mode | When to use | How |
|---|---|---|
| **Synthetic control** | ≥10 comparable SKUs not acted on | Donor pool weighted regression. Preferred. |
| **Pre/post trend** | Long history available | Forecast post-action values from pre-action trend |
| **Pre/post simple** | Sparse data | Compare action-window mean to N-week trailing mean |

Each outcome row records which mode was used so quality is auditable.

#### Impact-formula framework

The outcome loop is only as useful as the *predicted* number the customer sees up-front. After auditing the 11 SharkNinja alerts live in [agent v2](https://sharkninja.commerceiq.ai/us/amazon/retail/agents/v2/alerts), we landed on a structured registry rather than per-alert hardcoded math.

**Single source of truth:** [`/assets/formulas.js`](https://github.com/mshadaab27/commerceiq-brain/blob/main/assets/formulas.js) defines every alert's impact formula. The admin Impact Formulas table at [`/admin/outcomes.html#formulas`](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#formulas) is fully data-driven from this file — editing the registry updates both the table and the inspector.

**Three formula treatments.** Not every alert can produce a $ number with the same confidence; the registry encodes that honestly:

| Treatment | Schema | When |
|---|---|---|
| `primary` (+ optional `fallback`) | `at_risk_$ = expression` | Live alerts with observed inputs |
| `demoted` | `{ demoted: true, reason, reconsider_when }` | The signal is downstream (e.g. BSR is an *output* of velocity, not a driver) — attempting $ would double-count |
| `directional_only` | `{ v1_treatment, intended_formula, reason, reconsider_when }` | Inputs not productionized yet (e.g. SKU-level review sentiment, full SOV) — surface trend pill, no $ |

**Four statuses, today's distribution (n=11):** `live` (5) · `canary` (3) · `demoted` (1) · `directional_only` (2).

**Reason coefficients** — share of lift we credit ourselves, inherited by every playbook + formula. Promotion from canary requires three+ outcomes within ±15% of band; demotion happens automatically if the rolling-30 accuracy degrades past threshold.

| Reason | Coefficient | Confidence | Used by |
|---|---:|---:|---|
| Inventory | 1.00 | 0.95 | 1 formula · 1 playbook |
| BuyBox | 0.85 | 0.90 | 1 formula · 1 playbook |
| Shipping | 0.85 | 0.90 | 1 formula |
| Promo | 0.80 | 0.85 | 2 formulas · 2 playbooks |
| Content | 0.65 | 0.70 | 1 formula · 1 playbook |
| Media | 0.60 | 0.85 | 3 formulas · 1 playbook |

**Attribution boundary.** Revenue decomposes as `Revenue = Units × ASP` and `Units = Glance Views × Conversion`. We never claim $ attribution *below* the GV / CVR / ASP layer; every formula's `primary_metric` is one of `GV`, `CVR`, `ASP`, or `OOS_binary`. The 80% Key Contributor rule says: when multiple factors move at once, credit goes to the factor whose Shapley share exceeds 80% — otherwise the outcome stays in a multi-driver bucket. Reason coefficients then discount that share to what we actually caused vs. what would have moved anyway.

**Measurement window:** 14-day pre-period, 7-day post-period, synthetic-control donor pool of similar SKUs. Each formula records its `validation` block (`outcomes_count`, `accuracy_band`, `accuracy_pct`, `mean_abs_pct_error`, `bias`, `last_refresh`) so the admin Impact Formulas table can show rolling accuracy at a glance.

See the full spec in [`docs/brainstorms/2026-05-26-alert-impact-calculation-requirements.md`](https://github.com/mshadaab27/commerceiq-brain/blob/main/docs/brainstorms/2026-05-26-alert-impact-calculation-requirements.md) and the rollout / UX plan in [`docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md`](https://github.com/mshadaab27/commerceiq-brain/blob/main/docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md).

**Mockups:**
- [`/actions.html`](https://mshadaab27.github.io/commerceiq-brain/actions.html) — customer view (in-flight actions with predicted-vs-realized band)
- [`/admin/outcomes.html#formulas`](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#formulas) — data-driven formula registry + inspector

### L6 — Adaptation (rules that rewrite the system)

Six learning loops, all **off-line** so they never break a live conversation:

| Loop | Input | Output | Cadence |
|---|---|---|---|
| **Factor reweighting** | Outcomes from L5 | Update `brain_relations.strength` | Daily |
| **Constraint refinement** | User feedback (👍/👎/edit) on factor surfacing | Adjust constraint rule priority per tenant | Weekly |
| **Use-case mining** | Novel-question log from L3 | Propose new use case drafts to Composer | Weekly |
| **Routing tuning** | Router decisions vs. user satisfaction | Update Router classifier prompts / examples | Monthly |
| **Prompt drift detection** | Performance metrics by prompt version | Alert humans on regressions | Continuous |
| **Personalization** | Per-user action history | Update `brain_context` defaults for that user | Daily |

Every L6 change goes through a **canary**: applied to 10% of traffic, monitored for 48h, then rolled to 100% or reverted. Same mechanism the existing skill versioning already supports via `version_manager.py`.

**Mockup:** [`/admin/adapt.html`](https://mshadaab27.github.io/commerceiq-brain/admin/adapt.html) — 6 loops + pending review queue + canary status.

---

## 4. The two surfaces

A single principle structures the entire UI: **BRAIN's complexity belongs backstage.** The persona's expectations differ enough that they need separate apps.

### 4.1 Customer app (calm, analyst/exec persona)

```
              ┌──────────────────────────────────────┐
              │  CUSTOMER APP                       │
              │  (analyst / exec)                   │
              │                                     │
              │  ─ Briefing  (default)              │
              │  ─ Ask                              │
              │  ─ Actions                          │
              │                                     │
              │  3 surfaces total                   │
              │  Hides all architecture             │
              └──────────────────────────────────────┘
```

**Designed around the natural unit of work for a CPG analyst: the alert.**

| Surface | What it shows | URL |
|---|---|---|
| **Briefing** | Greeting + headline gap statement + ranked alert inbox + actions strip + ask bar | `/` |
| **Ask** | Open chat input + suggested questions + recent conversations (clickable) | `/ask.html` |
| **Actions** | Full outcome tracker — in flight, measured, did-not-work | `/actions.html` |
| **Alert deep-dive** | (Accessed by clicking an alert) KPIs + live status + RCA tree + recommendation + past activity | `/alert.html?id=<ASIN>` |

**Visible BRAIN signals** (only when they change the answer):

- Inline pill: *"same pattern flagged 14d ago"* (episodic recall)
- Subtitle: *"your fix is working: +9.2% so far"* (outcome loop)
- Subtitle: *"repeat pattern, 3× this quarter"* (memory surfacing)
- Hero sentence: BRAIN-synthesized ("Most of it (73%) is in Ice Cream Maker.")
- **Predicted-vs-realized band**: *"$54K → +$58K · +8% within band ✅"* (outcome accuracy at a glance — see §5 impact-formula framework)
- **Driver pill**: *"Conversion 82%"* (which factor moved most of the lift — attribution surfaced as a single chip, not a table)

**Invisible by design:** router decisions, agent execution traces, KG edge weights, confidence scores, learning meters, the Composer itself.

### 4.2 Admin portal (dense, operator persona)

```
              ┌───────────────────────────────────────┐
              │  INTERNAL ADMIN PORTAL                │
              │  (PM / CS / FDE / data team)          │
              │                                       │
              │  ─ Overview                           │
              │  ─ L1 Memory                          │
              │  ─ L2 Composer  (NL → use case)        │
              │  ─ L2 Skill Studio  (DAG)              │
              │  ─ L3 Orchestrate                      │
              │  ─ L5 Outcomes                         │
              │     └─ Playbooks      (6)              │
              │     └─ Outcomes       (14)             │
              │     └─ Impact formulas (8)             │
              │     └─ Coefficients   (6)              │
              │     └─ Reviews        (3)              │
              │  ─ L6 Adapt                            │
              └───────────────────────────────────────┘
```

**Designed around the natural unit of work for a PM/CS/FDE: the layer — with each layer page shaped as a *platform* of sub-resources, not a static dashboard.**

The sidebar lists the 6 BRAIN layers; each layer page (notably L5 Outcomes) follows a Linear-style resource model: sub-resources nested in the sidenav, scan-and-drill master-detail layout (table on the left, inspector on the right), and a slim header with breadcrumbs + actions. Click a row in any sub-resource and the right-hand inspector fills with that record's full context. Same shape repeats across Playbooks, Outcomes, Impact formulas, Coefficients, and Reviews — one learnable pattern, five entities.

Denser grids, monospace IDs, status pills (`live` / `canary` / `demoted` / `draft`), and inline mini-stats live across all admin pages.

### 4.3 Why the split matters

| | Customer | Admin |
|---|---|---|
| **Who** | Brand analyst / VP at SharkNinja, P&G, Unilever | PM / CS / FDE / data team at CommerceIQ |
| **Goal** | "What's broken? What should I do? Did my last fix work?" | "How do I add a new use case? Why did the Router slip? Is the KG drifting?" |
| **Density** | Whitespace-heavy, scannable, headline-driven | Dense tables, charts, side-by-side detail |
| **Chrome** | Almost none — mostly bare rows | Sidebar, breadcrumbs, status pills, mono everywhere |
| **What changes** | Same 3-tab shell across all product lines (DSA, MAP, RMM, RGM) — new use cases just appear as new alert types | Different layer pages may evolve; per-layer features grow over time |

**Critical implication for scale:** new product lines don't get a new customer UI. They get new use cases authored in the Composer that surface as new alert kinds inside the same Briefing. **One UI to maintain, every product line scaling through it.**

---

## 5. A request's journey through BRAIN

A concrete trace of how the analyst's question *"Why did Ninja CREAMi miss plan last week?"* travels through all 6 layers:

```
[1] Customer types question in Ask bar (or clicks a briefing alert)
        ↓
[2] L3 ROUTER fires:
      - Reads L1 episodic: "We answered this 14d ago for the same SKU."
      - Reads L1 KG: "This SKU has high deal_badge_present→ops weight."
      - Reads L1 context: tenant=SharkNinja, user=Sarah/CSM/Ninja-default.
      - Matches procedural memory: high confidence (0.92) for RCA_FOR_SKU.
      - Decision: direct route + recall pill ("investigated 14d ago")
        ↓
[3] L4 EXECUTION:
      - amazon_rca_agent runs RCA_FOR_SKU
      - 5 parallel signals + 6 supplemental tools fire concurrently
      - Constraint rules (DATA + ANALYSIS + PRESENTATION) applied
      - Output: structured RCA card with factors ranked by KG strength
        ↓
[4] L1 EPISODIC MEMORY records the investigation:
      brain_investigations row inserted with question, routed_to,
      hypotheses, evidence, conclusion (no outcome yet)
        ↓
[5] Customer sees the answer in the Alert page.
      Inline pill: "same pattern flagged 14d ago"
      Recommendation: "Fix deal badge + reset Matching event price"
      Predicted lift: +8–15% over 7 days, synthetic control of 12 donors
        ↓
[6] Customer clicks "Mark as fixed & track"
        ↓
[7] L5 OUTCOME TRACKER:
      brain_actions row inserted with baseline + expected_impact
      [next 7 days: daily cron measures dependent metrics]
        ↓
[8] On day 7, L5 computes lift vs synthetic baseline:
      Actual lift: +9.2% OPS (above lower bound, below upper)
      brain_outcomes row inserted with method='synthetic_control'
        ↓
[9] L6 ADAPTATION:
      Factor reweighting loop runs daily:
        brain_relations[(deal_badge_present → ops)]
          .evidence_n += 1
          .strength = bayesian_update(0.84, +9.2%) = 0.91
          .last_validated_at = now
        ↓
[10] L1 KG NOW HAS UPDATED BELIEF.
      Next time RCA_FOR_SKU runs for any SharkNinja SKU,
      "Deal Visibility" factor surfaces higher in the ranking
      because BRAIN now knows it reliably moves OPS for this client.
```

**This is the closed loop.** Steps 1–5 are what the customer sees. Steps 6–10 are how BRAIN gets smarter.

---

## 6. The outcome loop — what makes BRAIN learn

The most important single behavior in BRAIN, isolated:

```
  recommendation → action taken → measure vs baseline → update belief
         ↑                                                    │
         └───────────────── next time ──────────────────────────┘
```

Without this loop, BRAIN is just a smarter UI. **With it, BRAIN compounds value over time.**

Key properties:

- **Every accepted recommendation is tracked.** Not optional.
- **Every measurement uses a counterfactual.** Synthetic control where possible, pre/post otherwise.
- **Every outcome updates a specific edge in the KG.** With provenance: which action, which method, which donor pool.
- **Negative outcomes count.** A recommendation that doesn't work lowers the relevant edge's strength.
- **Tenant-scoped beliefs.** "Deal badge moves OPS" may have +0.91 strength for SharkNinja and only +0.42 for a different brand whose customers care about price more.

---

## 7. Authoring model — who creates what

Lowering the engineering bar is the single biggest unlock for adding use cases at scale.

| Role | What they can author | Tool | Approval needed? |
|---|---|---|---|
| **Engineering** | Anything | Direct PR | Code review |
| **PM** | New use cases (NL prompt → SQL → constraints) | Composer | Reviewer (1 person) |
| **CS / Solutions** | New tenant context, scoped constraints | Composer + context store | Self (for tenant scope) |
| **FDE** | New skills (DAG composition of existing use cases) | Skill Studio | Reviewer (1 person) |
| **End user (analyst)** | Per-thread context, per-user defaults | In-product context box | None |

Every author surface writes to the **same database tables** the existing agents already read: `standard_rca_use_cases`, `constraint_rules`, `skills`. There's no parallel data model.

---

## 8. Multi-tenant, multi-product, personalized

The KG, episodic store, context store, and procedural memory all carry a `scope` column. Resolution rule: **most-specific scope wins**, with a deterministic precedence ladder (same pattern as the existing `CLIENT_RETAILER > CLIENT > RETAILER > GLOBAL` skill resolution).

```
scope = 'global'                       → applies to all clients, all products
scope = 'product:DSA'                  → applies to one product
scope = 'product:DSA|client:1360'      → applies to one client in one product
scope = 'client:1360'                  → client-specific
scope = 'client:1360|user:42'          → per-user inside a client
scope = 'thread:abc-123'               → just this conversation
```

**Cross-product knowledge sharing:** a learned causal link `deal_badge_present → ops` at `product:DSA` scope can be **promoted to global** once it has accumulated evidence from ≥3 products — a governance workflow PM owns. This is what lets BRAIN power *every* CommerceIQ product without duplication.

---

## 9. How BRAIN integrates with the existing platform

BRAIN is **additive.** Five new tables, three new agents (Router, Composer-agent, Outcome-Tracker), one new UI portal. Everything underneath stays.

| BRAIN concept | Reuses existing… |
|---|---|
| Procedural memory (L1) | `standard_rca_use_cases`, `constraint_rules`, `skills` tables |
| Skill bindings & versioning | `domain/skills/` — service, resolver, version_manager |
| Composer's text-to-SQL | `domain/tools/definitions/query_planner/` |
| Router as new agent | `domain/deepagents/core/registry.py` — register one more agent |
| Authored skills injection | `middleware/active_skill_bootstrap.py` |
| Caching of replayed investigations | Existing `cache_policy.py` + Redis layer |
| Investigation traces | Existing Opik tracing + checkpointer |
| Multi-agent execution | DeepAgents core executor |

### New tables (sketch)

```sql
brain_entities       (id, type, external_id, attributes, embedding)
brain_relations      (src, tgt, type, strength, confidence, evidence_n,
                      scope, last_validated_at)
brain_investigations (id, thread_id, client_id, user_id,
                      question, question_emb, routed_to,
                      hypotheses, evidence, conclusion,
                      feedback, outcome_status, created_at)
brain_actions        (id, investigation_id, sku, action_type,
                      target_metrics, baseline_values, expected_lift,
                      taken_at, taken_by_user)
brain_outcomes       (id, action_id, measurement_window_start,
                      measurement_window_end, actual_values,
                      counterfactual_baseline, lift_pct,
                      significance, conclusion)
brain_context        (id, scope, scope_id, type, content, embedding,
                      expires_at, source)
brain_drafts         (id, author_user_id, draft_type, status, payload,
                      generated_artifacts, tenant_scope,
                      approved_by, approved_at)

-- Impact-formula framework (see §5 Impact-formula framework)
brain_alert_formulas    (id, alert_type, primary_metric, reason_category,
                         reason_coefficient, status, version, formula_jsonb,
                         scope, published_at, deprecated_at)
brain_formula_constants (id, formula_id, name, value, unit, source, last_refresh,
                         confidence)
brain_impact_predictions(id, alert_id, formula_id, formula_version, sku,
                         predicted_at_risk_$, predicted_lift_band,
                         primary_metric, predicted_at, window_days)
brain_impact_actuals    (id, prediction_id, action_id, measurement_method,
                         actual_metric_value, counterfactual_value,
                         observed_lift, within_band, measured_at)
brain_formula_accuracy  (formula_id, rolling_window_days, outcomes_count,
                         within_band_count, accuracy_pct,
                         mean_abs_pct_error, bias, last_refresh)
```

See [Appendix](#14-appendix--data-shapes) for full schemas.

---

## 10. Personas and what they see

### 👩‍💼 Sarah — Brand CSM at SharkNinja

- Opens [`/`](https://mshadaab27.github.io/commerceiq-brain/) at 9am, sees "Your business is tracking $1.2M behind plan this week. Most of it (73%) is in Ice Cream Maker."
- Scans the briefing inbox, clicks the top alert (CREAMi NC301).
- Sees the RCA card with one inline pill: *"same pattern flagged 14d ago"*.
- Clicks **Mark as fixed & track**, gets a toast, moves on.
- Three days later, returns and sees in "Your actions" that her fix is producing +9.2% lift.

**She never sees:** the router, the KG, the multi-agent plan, the constraint rules, the synthetic control donor pool.

### 👨‍💼 Vikram — VP Sales at SharkNinja

- Same surfaces as Sarah, but typically only the hero headline and the Actions tracker.
- Asks Sarah to dig into the top 3 SKUs.
- Uses the recovered-revenue total ("$1.8M recovered this month") in his QBR deck.

### 👩‍💻 Priya — PM at CommerceIQ

- Opens [`/admin/composer.html`](https://mshadaab27.github.io/commerceiq-brain/admin/composer.html), drafts a new use case called `MEDIA_KEYWORD_FRESHNESS`.
- Reviews the auto-generated SQL + constraint rules.
- Publishes to `client:SharkNinja` scope. Canary rolls to 10%.
- 48h later, sees in [`/admin/adapt.html`](https://mshadaab27.github.io/commerceiq-brain/admin/adapt.html) the canary held — promotes to 100%.

### 👨‍🔬 Marcus — FDE at CommerceIQ

- Opens [`/admin/studio.html`](https://mshadaab27.github.io/commerceiq-brain/admin/studio.html), builds a `weekly_top_risks_briefing` skill: cron → TOP_DRIVERS → RTS → if-gate → RCA + alert.
- Tests, publishes to `client:SharkNinja`.
- Skill now runs every Monday 8am ET, posting new alerts to Sarah's Briefing.

### 👩‍🔬 Anjali — Data Science at CommerceIQ

- Opens [`/admin/memory.html`](https://mshadaab27.github.io/commerceiq-brain/admin/memory.html), audits the causal graph.
- Notices `deal_badge_present → ops` at SharkNinja has accumulated evidence from 14 outcomes.
- Submits a governance request to promote the edge to global scope (`product:DSA`).
- Reviews methodology in [`/admin/outcomes.html`](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html).

---

## 11. Mockup reference — where to explore each idea

Click any link to open that page in the live mockup. All pages share one design system; all data is from the real SharkNinja agent UI.

### Customer (calm)

| Page | Idea it demonstrates |
|---|---|
| [Briefing](https://mshadaab27.github.io/commerceiq-brain/) | Ranked alert inbox + inline BRAIN hints + actions strip |
| [CREAMi NC301](https://mshadaab27.github.io/commerceiq-brain/alert.html?id=B08QXB9BH5) | Alert deep-dive with KPIs, live status, full RCA tree |
| [FlexFlame ProConnect](https://mshadaab27.github.io/commerceiq-brain/alert.html?id=B0GHPM2C3Y) | "Repeat pattern, 3× this quarter" — memory surfacing |
| [Ask page](https://mshadaab27.github.io/commerceiq-brain/ask.html) | Open chat + suggestions + recent conversations |
| [Plan vs Actual thread](https://mshadaab27.github.io/commerceiq-brain/ask.html?thread=c1) | Full brand + sub-category breakdown |
| [Actions tracker](https://mshadaab27.github.io/commerceiq-brain/actions.html) | Outcome loop with synthetic-baseline sparklines |

### Admin (dense)

| Page | Layer | Idea it demonstrates |
|---|---|---|
| [Overview](https://mshadaab27.github.io/commerceiq-brain/admin/) | — | Gateway to all 6 layers |
| [Memory](https://mshadaab27.github.io/commerceiq-brain/admin/memory.html) | L1 | Causal graph + episodic + procedural + context |
| [Composer](https://mshadaab27.github.io/commerceiq-brain/admin/composer.html) | L2 | NL → use case 3-step wizard |
| [Skill Studio](https://mshadaab27.github.io/commerceiq-brain/admin/studio.html) | L2 | Visual DAG editor |
| [Orchestrate](https://mshadaab27.github.io/commerceiq-brain/admin/orchestrate.html) | L3 | Router decision feed + novel mining |
| [Outcomes · Playbooks](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#playbooks) | L5 | Authored action playbooks with criteria + worked-rate |
| [Outcomes · Impact formulas](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#formulas) | L5 | Data-driven formula registry + inspector (live / canary / demoted / directional) |
| [Outcomes · Coefficients](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#coefficients) | L5 | Six reason coefficients with scope + last-refresh |
| [Outcomes · Reviews](https://mshadaab27.github.io/commerceiq-brain/admin/outcomes.html#reviews) | L5 | Pending system-proposed refinements (canary queue) |
| [Adapt](https://mshadaab27.github.io/commerceiq-brain/admin/adapt.html) | L6 | 6 learning loops + pending review queue |

### Source-of-truth artifacts

The registry and the brainstorm docs travel with the mockup. They are the durable record of *what* the framework computes and *how* the platform plans to build it.

| Artifact | Role |
|---|---|
| [`assets/formulas.js`](https://github.com/mshadaab27/commerceiq-brain/blob/main/assets/formulas.js) | Source of truth for all 11 alert impact formulas. The admin table renders directly from this file. |
| [`docs/brainstorms/2026-05-26-alert-impact-calculation-requirements.md`](https://github.com/mshadaab27/commerceiq-brain/blob/main/docs/brainstorms/2026-05-26-alert-impact-calculation-requirements.md) | Requirements doc: what the framework computes (per-alert specs, three exception patterns, 80% Key Contributor rule). |
| [`docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md`](https://github.com/mshadaab27/commerceiq-brain/blob/main/docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md) | UX + platform plan: customer accuracy band, admin formula registry, 5 new tables, 4-phase rollout. |

---

## 12. Suggested rollout phases

Incremental — no big bang. Each phase ships value on its own.

| Phase | Ship | Why first |
|---|---|---|
| **0 — Foundations** | New brain tables, scope resolution, KG seed from current use cases/constraints | Required by everything else; no user-visible change |
| **1 — Composer (MVP)** | NL→use case generator using query planner; review UI; auto-seed to existing tables | Immediate wins — PMs unblocked from engineering for new use cases |
| **2 — Outcome tracking** | Action log + measurement job + KG belief updates | The "did it work" loop that makes the system actually learn |
| **2b — Impact-formula framework** | Hardcoded registry → accuracy visibility → admin-editable formulas → auto-recalibration via L6. See [impact-tracking UX + platform plan](https://github.com/mshadaab27/commerceiq-brain/blob/main/docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md) | Sub-phase of #2 — makes "predicted lift" trustworthy before customers act on it |
| **3 — Router (advisory mode)** | Router runs in shadow alongside today's prompt-based routing, logs disagreements | Gather training signal without behavior change |
| **4 — Router (live)** | Promote Router to control plane, deprecate Mode-1/Mode-2 prompt branching | Now cross-agent investigations are possible |
| **5 — Skill Studio + Context** | Visual skill composer + user/tenant/thread context injection | Productizes the authoring surface fully |
| **6 — Adaptation loops** | L6 background jobs turned on with canary | Self-improvement at scale |

---

## 13. Open questions

Things the design intentionally leaves to be decided by stakeholders:

1. **Author trust model.** Can a CS rep publish a rule to a tenant directly, or does every change require approval? (Approval = safer, slower. Direct = faster, blast-radius risk.)
2. **Counterfactual rigor vs. shipping speed.** Synthetic control is correct but expensive; trailing-mean is fast but biased. Where do we draw the bar?
3. **KG promotion governance.** When does a learned link at `client:1360` graduate to `global`? Manual? Threshold + sign-off? Auto?
4. **Router latency budget.** Adding a meta-agent adds ~1–2s. For high-frequency questions (CSMs in Slack), is that acceptable, or do we need a fast-path bypass for cached question types?
5. **Personalization vs. surprise.** A heavily personalized BRAIN might never show a CSM the factor they didn't know mattered. How much exploration do we force?
6. **Outcome attribution boundary.** Partially answered (§5 impact-formula framework): no $ attribution below the GV/CVR/ASP layer, reason coefficients discount our share, the 80% Key Contributor rule routes mixed outcomes to a multi-driver bucket. Still open: when two formulas fire on the same SKU in overlapping windows, do we use pairwise Shapley decomposition or sequential credit assignment?
7. **Privacy / data residency.** Does episodic memory from EU clients ever cross into the global KG? Where does it live?

---

## 14. Appendix · Data shapes

Full table definitions sketched. Production schemas would refine types, indexes, and constraints.

```sql
-- L1: Causal knowledge graph
CREATE TABLE brain_entities (
  id            UUID PRIMARY KEY,
  type          TEXT NOT NULL,   -- 'factor' | 'signal' | 'metric' | 'action'
  external_id   TEXT,            -- e.g. 'deal_badge_present'
  attributes    JSONB,
  embedding     VECTOR(1536)
);

CREATE TABLE brain_relations (
  id                 UUID PRIMARY KEY,
  src_entity_id      UUID REFERENCES brain_entities(id),
  tgt_entity_id      UUID REFERENCES brain_entities(id),
  relation_type      TEXT NOT NULL,  -- 'causes' | 'precedes' | 'correlates_with'
  strength           NUMERIC,        -- learned weight, signed
  confidence         NUMERIC,        -- 0..1
  evidence_n         INT NOT NULL DEFAULT 0,
  scope              TEXT NOT NULL,  -- 'global' | 'product:X' | 'client:Y' | ...
  last_validated_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- L1: Episodic memory
CREATE TABLE brain_investigations (
  id              UUID PRIMARY KEY,
  thread_id       TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  user_id         TEXT,
  question        TEXT NOT NULL,
  question_emb    VECTOR(1536),
  routed_to       JSONB,           -- agents/use_cases used
  hypotheses      JSONB,
  evidence        JSONB,
  conclusion      TEXT,
  feedback        JSONB,           -- thumbs up/down, edits, dismissal
  outcome_status  TEXT,            -- 'pending' | 'measured' | 'replaced'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- L5: Action log + outcomes
CREATE TABLE brain_actions (
  id                 UUID PRIMARY KEY,
  investigation_id   UUID REFERENCES brain_investigations(id),
  sku                TEXT NOT NULL,
  action_type        TEXT NOT NULL,    -- 'FIX_PROMO_BADGE' | 'BOOST_AD_SPEND' | ...
  target_metrics     JSONB NOT NULL,
  baseline_values    JSONB NOT NULL,
  expected_lift      JSONB NOT NULL,
  taken_at           TIMESTAMPTZ NOT NULL,
  taken_by_user      TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE brain_outcomes (
  id                          UUID PRIMARY KEY,
  action_id                   UUID REFERENCES brain_actions(id),
  measurement_window_start    TIMESTAMPTZ,
  measurement_window_end      TIMESTAMPTZ,
  actual_values               JSONB NOT NULL,
  counterfactual_baseline     JSONB NOT NULL,
  baseline_method             TEXT NOT NULL,  -- 'synthetic_control' | 'pre_post_trend' | 'pre_post_simple'
  donor_pool                  JSONB,           -- when synthetic_control
  lift_pct                    NUMERIC,
  significance                NUMERIC,
  conclusion                  TEXT NOT NULL    -- 'positive' | 'neutral' | 'negative' | 'inconclusive'
);

-- L1: Context store
CREATE TABLE brain_context (
  id           UUID PRIMARY KEY,
  scope        TEXT NOT NULL,
  scope_id     TEXT,
  type         TEXT NOT NULL,   -- 'preference' | 'knowledge' | 'event'
  content      TEXT NOT NULL,
  embedding    VECTOR(1536),
  expires_at   TIMESTAMPTZ,
  source       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- L2: Author drafts
CREATE TABLE brain_drafts (
  id                     UUID PRIMARY KEY,
  author_user_id         TEXT NOT NULL,
  draft_type             TEXT NOT NULL,   -- 'use_case' | 'constraint' | 'skill' | 'algorithm'
  status                 TEXT NOT NULL,   -- 'drafting' | 'review' | 'canary' | 'approved' | 'rejected'
  payload                JSONB NOT NULL,
  generated_artifacts    JSONB,           -- SQL, schema, etc.
  tenant_scope           TEXT NOT NULL,
  reviewer_user_id       TEXT,
  approved_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Where to go from here

- **Read the mockup files:** `index.html`, `alert.html`, `ask.html`, `actions.html`, then anything under `admin/`.
- **Inspect the data:** `assets/data.js` is the single source of truth that all customer pages consume. It mirrors what the real platform would expose via a Brain API.
- **Open an issue in the repo** with proposals or pushback.

_Document version: 1.0 · Authored from the design sessions that produced the mockup._
