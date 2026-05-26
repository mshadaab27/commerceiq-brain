# Impact Tracking Framework — UX + Brain Platform Plan

> **Status:** Plan (HOW to build, complementing the requirements doc)
> **Date:** 2026-05-26
> **Author:** Mohammad Shadaab
> **Requirements doc:** [2026-05-26-alert-impact-calculation-requirements.md](./2026-05-26-alert-impact-calculation-requirements.md)

---

## 1. Overview

The requirements doc defines **what** the impact-tracking framework calculates (per-alert at-risk → realized math). This document defines **how** the Brain platform exposes and operates it across three layers:

1. **Customer UX** — analyst sees: at-risk → action → realized → accuracy
2. **Admin UX** — PM/FDE: author formulas, manage constants, monitor accuracy
3. **Brain platform** — data model + integration with L1 Memory, L5 Outcomes, L6 Adapt

The whole framework is **additive** to the existing Brain architecture. No new layers. No new agents. Five new tables, two new admin surfaces, three updated customer surfaces.

---

## 2. Customer UX (the analyst-facing view)

The analyst sees four moments in the impact lifecycle:

```
  ALERT FIRES         ACTION TAKEN          MEASUREMENT          ACCURACY
  $58K at risk   →    Mark as fixed    →    Day 4/7         →    ±15% over time
     (predicted)      Tracking started    Pre $307K          (predicted)
                      Brain measures      Post $365K
                                          Realized +$52K
```

### 2.1 Alert page (existing surface, refined)

**Today:** the alerts page shows SKUs with a $ next to each. The number is opaque — no formula visible.

**v1 addition:** every alert row + drill-down shows an *at-risk* badge with a small `ⓘ` icon. Hover or click reveals:

```
╔═════════════════════════════════════════════════════╗
║ −$58K at risk this week  ⓘ                              ║
║ ——————————————————————————————————————————————— ║
║ Lost Buy Box → Conversion is the driver                 ║
║                                                        ║
║ Pre-LBB daily OPS:  $44K                               ║
║ During-LBB daily:   $36K                               ║
║ Days projected:     7                                  ║
║ ———————————————————————————————————————————————— ║
║ = 7 × ($44K − $36K) = $58K                              ║
║                                                        ║
║ Last 30 outcomes from this formula:                    ║
║ within ±15% of realized 8/10 times → 88% accurate       ║
╚═════════════════════════════════════════════════════╝
```

The analyst sees: the number, what drives it, what it's based on, and how trustworthy the formula has been historically. **The badge is the trust signal.**

When the recommendation appears, it carries the **same projected $:**

> *"Restore Buy Box in SAS — projected recovery: **+$58K** (Conversion-led)"*

With a `Mark as fixed & track` button that creates a prediction record linked to the outcome.

### 2.2 Outcome card (existing surface, evolved)

The outcome card today shows the realized $ and a Shapley split. **v1 adds the predicted-vs-realized header.**

```
╔═════════════════════════════════════════════════════╗
║ LIVE · Day 4 of 7                                       ║
║                                                        ║
║ Predicted  →  Realized (projected)                     ║
║   $58K    →    $52K       within ±10%   ✅            ║
║                                                        ║
║ [existing Shapley bars + sub-metric chips]             ║
║ [existing long-term direction pills]                   ║
╚══════════════════════════════════════════════════════╝
```

The header band gives the **at-a-glance trust signal**. Big number is realized; smaller predicted number sits left of it; accuracy is the verdict. Same color logic as Shapley bars (green / amber / red).

The rest of the card is unchanged (Shapley + sub-metric chips + long-term pills).

### 2.3 Compact rows on the Actions page (existing surface, +1 cell)

Add a small accuracy indicator next to each measured outcome:

| Outcome | Status | Realized | Long-term |
|---|---|---|---|
| Restore parent ASIN promo | Worked | **+$119K** · *predicted $124K (±4%)* | ↑ Visibility |
| Boost ad spend P0 KWs | Worked | **+$113K** · *predicted $98K (±15%)* | ↑ Visibility ↑ SOV |
| Match competitor price | Did not work | **−$2K** · *predicted +$8K (miss)* | — Still flipping |

The accuracy line is small (italic, gray), one click away from full detail. Failures stay honest — the “miss” label on the third row is intentional.

### 2.4 New `Accuracy` view (Phase 2)

A new top-level section on the Actions page (or its own page) that shows trust over time:

```
╔═════════════════════════════════════════════════════╗
║ OUR PREDICTIONS ARE WITHIN ±17% ON AVERAGE              ║
║                                                        ║
║ By alert type (last 30 outcomes per type):             ║
║                                                        ║
║   Out of Stock         ±5%   ✅ (deterministic)         ║
║   Lost Buy Box        ±12%   ✅                        ║
║   Missing Promo Badge ±15%   ✅                        ║
║   Keyword Rank Drop   ±19%   ✅                        ║
║   Media Spend         ±25%   ⚠️ (constants drifting)    ║
║   Rating Dropped      ±32%   ⚠️ (slow effects)         ║
║                                                        ║
║ [view trend chart →]                                   ║
╚══════════════════════════════════════════════════════╝
```

This is the **headline trust signal**, shippable when we have ~30 outcomes per alert (probably end of Q3).

---

## 3. Admin UX (the PM / FDE-facing platform)

### 3.1 New "Impact formulas" section under L5 Outcomes

A sibling to the existing **Playbooks**, **All outcomes**, **Coefficients**, and **Reviews** tabs:

```
L5 Outcome tracking
├─ Playbooks         (alert → actions; existing)
├─ All outcomes      (cross-cutting view; existing)
├─ Coefficients      (reason coefficients; existing)
├─ Reviews           (pending changes; existing)
└─ Impact formulas   (NEW — the at-risk formula registry)
```

The **Impact formulas** tab is where PMs/FDEs:

- Browse the 11 formula registry (one per alert)
- See each formula's primary metric, current constants, accuracy band, validation outcomes count
- Click into one to view + propose changes

### 3.2 The formula detail view

When a PM clicks `Lost Buy Box`:

```
Lost Buy Box — Impact Formula
[Edit] [Duplicate per client] [View accuracy history]

╔═════════════════════════════════════════════════════╗
║ 1. PRIMARY METRIC      CVR                              ║
║ 2. REASON COEFFICIENT  0.85  (BuyBox)                   ║
║ 3. FORMULA                                              ║
║     at_risk_$ = days_LBB_projected                      ║
║                × (pre_LBB_daily_OPS                      ║
║                   − during_LBB_daily_OPS)               ║
║ 4. CONSTANTS                                            ║
║     [no constants — formula is direct subtraction]     ║
║ 5. FALLBACK                                             ║
║     Uses sub_category_CVR_delta if no prior LBB event   ║
║ 6. ACCURACY (last 30 outcomes)                          ║
║     within ±15%   8 of 10  ✅                            ║
║     gross over-predicts  2 of 10                        ║
╚══════════════════════════════════════════════════════╝

Recent outcomes used to validate:
[table linking to actual outcomes]
```

Each formula has an `Edit` button that opens an **inline editor** with the formula expression, constants, fallback rules, and validation harness.

### 3.3 Constants registry

A simpler sibling page that lists every empirical constant used across formulas:

| Constant | Type | Current value | Used by | Scope | Last refresh | Accuracy if changed |
|---|---|---|---|---|---|---|
| Position-CTR curve | curve | rank1=0.30, ... | KW Rank Drop | global | May 18 | preview → |
| CVR sensitivity / 0.5★ | scalar | 0.075 | Rating Dropped | global | Apr 28 | preview → |
| Badge presence CVR uplift | scalar | 0.18 | Missing Promo Badge | global | May 11 | preview → |
| iRoAS — SharkNinja | per-SKU | last-30d empirical | Media Spend | client:SharkNinja | daily | live |
| Shipping-degrade table | table | (see detail) | Shipping Speed | global | Mar 14 | preview → |

Click `preview →` runs the new value against the last 30 outcomes and shows expected accuracy delta.

### 3.4 Formula authoring wizard (Phase 3)

When a PM clicks `+ New formula` (added when we expand beyond the 11):

4-step wizard, structurally identical to the `+ New playbook` wizard already on the admin page:

1. **Trigger** — which alert type does this formula compute for?
2. **Primary metric** — GV / CVR / ASP / OOS-binary
3. **Formula** — expression with field references (`baseline_daily_OPS`, `LBB%`, etc.) and constants
4. **Validate** — run against last 90 days of historical outcomes; if accuracy band <±30%, allow publish to Canary

The formula expression language is **a simple template**, not a DSL or full code:
```
at_risk_$ = {baseline_daily_OPS}
          * {CVR_loss_from_shipping_degrade}
          * {days_at_risk}
```
Field references are validated at save time against the data catalog.

### 3.5 Pending review integration

The existing **Reviews** queue gets three new change types:

- *Formula refinement proposal* — from L6 Adapt when accuracy drifts
- *Constant recalibration* — quarterly, with preview impact
- *New formula promotion* — from Canary → 100% after stability period

---

## 4. Brain platform integration

The framework slots cleanly into the existing 6-layer Brain architecture. No new layers — just five new tables and three updated layer behaviors.

### 4.1 Data model additions

```sql
-- Registry of impact formulas
brain_alert_formulas (
  id                  UUID PRIMARY KEY,
  alert_type          TEXT NOT NULL,                -- 'lost_buy_box'
  primary_metric      TEXT NOT NULL,                -- 'GV' | 'CVR' | 'ASP' | 'OOS_binary'
  formula_expression  TEXT NOT NULL,                -- template string
  fallback_expression TEXT,
  scope               TEXT NOT NULL,                -- 'global' | 'client:X' | ...
  reason_coefficient  NUMERIC,                      -- defaults from coefficient table
  status              TEXT NOT NULL,                -- 'draft' | 'canary' | 'live' | 'deprecated'
  version             INT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  created_by          TEXT,
  validated_outcomes  INT DEFAULT 0
);

-- Per-formula constants (curves, scalars, tables)
brain_formula_constants (
  id              UUID PRIMARY KEY,
  formula_id      UUID REFERENCES brain_alert_formulas(id),
  constant_key    TEXT NOT NULL,                    -- 'position_CTR_curve'
  constant_type   TEXT NOT NULL,                    -- 'scalar' | 'curve' | 'table'
  constant_value  JSONB NOT NULL,
  scope           TEXT NOT NULL,                    -- 'global' | 'client:X'
  refresh_cadence TEXT,                             -- 'quarterly' | 'rolling_30d' | 'daily'
  last_refresh    TIMESTAMPTZ
);

-- Predictions made by formulas (ex-ante)
brain_impact_predictions (
  id                UUID PRIMARY KEY,
  alert_id          UUID,                            -- the firing alert
  sku_id            TEXT,
  formula_id        UUID REFERENCES brain_alert_formulas(id),
  formula_version   INT,
  at_risk_dollars   NUMERIC NOT NULL,
  primary_metric    TEXT NOT NULL,
  inputs_snapshot   JSONB NOT NULL,                 -- the values that went into the formula
  predicted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at        TIMESTAMPTZ
);

-- Realized impact tied to predictions (ex-post)
brain_impact_actuals (
  id                  UUID PRIMARY KEY,
  outcome_id          UUID REFERENCES brain_outcomes(id),
  prediction_id       UUID REFERENCES brain_impact_predictions(id),
  realized_dollars    NUMERIC NOT NULL,
  shapley_decomposition JSONB NOT NULL,             -- {GV: $7K, CVR: $48K, ASP: $3K}
  primary_metric_share NUMERIC,                     -- the relevant Shapley share
  accuracy_pct        NUMERIC,                      -- realized / predicted
  measured_at         TIMESTAMPTZ DEFAULT now()
);

-- Rolling accuracy per formula per client
brain_formula_accuracy (
  formula_id              UUID,
  client_id               TEXT,
  rolling_window_days     INT,
  outcomes_count          INT,
  accuracy_within_30pct   NUMERIC,                  -- fraction of outcomes within ±30%
  mean_absolute_pct_error NUMERIC,
  bias                    NUMERIC,                  -- systematic over/under
  last_calculated_at      TIMESTAMPTZ,
  PRIMARY KEY (formula_id, client_id, rolling_window_days)
);
```

This sits next to (not on top of) the existing playbook / coefficient / outcome tables.

### 4.2 L1 Memory integration

Three additions to the Knowledge Graph:

- **Nodes:** `alert_type`, `primary_metric`, `formula_constant`
- **Edges:** `alert_type → primary_metric` with `strength = rolling_accuracy_within_30pct`
- **Episodic memory:** every `(prediction, outcome)` pair becomes a training example we can replay later

The edge strength becomes a learning signal: alerts whose primary metric mapping is uncertain show low edge strength, prompting investigation.

### 4.3 L5 Outcome tracking integration

The L5 outcome pipeline already runs Shapley decomposition. The addition is:

1. When an action is `Mark as fixed`, look up the originating alert’s `prediction_id` and link it to the outcome row
2. After measurement window closes, compute accuracy: `realized.primary_metric_share / prediction.at_risk_dollars`
3. Write to `brain_impact_actuals`; update `brain_formula_accuracy`

### 4.4 L6 Adapt integration

A new learning loop joins the existing 6:

| Loop | Trigger | Output | Cadence |
|---|---|---|---|
| Formula accuracy monitoring (NEW) | accuracy < 70% over 5+ outcomes | Propose constant refinement, formula tune, or scope demotion | Weekly |

Proposals flow into the existing Pending Review queue with the same Canary → 100% approval cycle.

---

## 5. Rollout phases

Four phases, each shipping value independently:

### Phase 1 — Hardcoded formulas live (this quarter)

- Implement the 8 deterministic formulas in code (engineering-owned)
- Surface at-risk $ on every alert with the `ⓘ` formula-disclosure
- Surface predicted vs. realized header on every outcome card
- New tables in place but constants are static

**Done when:** `actions.html` + `alert.html` show predicted vs realized for all 8 alerts; `admin/outcomes.html` shows a read-only formula registry.

### Phase 2 — Accuracy visibility (next quarter)

- Add the customer-facing **Accuracy** view to the Actions page
- Public-facing “within ±X%” trust badge
- Cross-alert accuracy comparison

**Done when:** every measured outcome shows accuracy verdict; the headline "within ±17%" stat is live.

### Phase 3 — Formula editor in admin (next quarter+1)

- PM/FDE can edit constants from admin UI
- Validation harness: simulate constants against last 90 days of outcomes; show projected accuracy delta
- Add formula authoring wizard for new alert types
- Constant changes go through Pending Review queue

**Done when:** PM can change `Position-CTR curve` value, see preview, send for review, approve → Canary → Live without engineering involvement.

### Phase 4 — Auto-recalibration (Q4 + beyond)

- L6 Adapt loop: "Formula accuracy monitoring" runs weekly
- Proposes constant updates when accuracy drifts
- Same Canary safety as existing loops
- Per-client constants opt-in when accuracy materially better than global

**Done when:** at least one auto-recalibration has completed end-to-end (proposed by L6, reviewed, canaried, promoted) without engineering touching it.

---

## 6. Mockups to build / update

Files in this repo to change as we ship:

| Phase | File | Change |
|---|---|---|
| 1 | `alert.html` | Add `ⓘ` formula-disclosure on at-risk $ |
| 1 | `actions.html` | Add predicted-vs-realized header band on featured outcome card + accuracy hint on compact rows |
| 1 | `admin/outcomes.html` | Add **Impact formulas** tab with read-only registry |
| 2 | `actions.html` | Add **Accuracy** section with cross-alert accuracy table |
| 3 | `admin/outcomes.html` | Make Impact formulas tab editable; add constants registry sub-tab |
| 3 | new file: `admin/formula-editor.html` | Formula authoring wizard |
| 4 | `admin/adapt.html` | Add "Formula accuracy monitoring" loop card |

---

## 7. Open decisions for engineering

1. **Formula expression language:** simple template (`{field} * {constant}`) vs. expression DSL vs. full code? Recommend template for v1 — PMs can read it, engineering escape-hatches into code if needed.

2. **Constants storage:** in `brain_alert_formulas.formula_expression` directly (inlined) vs. separate `brain_formula_constants` table (referenced by key)? Recommend the separate table for shareability and refresh-cadence flexibility.

3. **Prediction lifetime:** how long is an at-risk $ valid? Recommend recompute on every data refresh (~daily); expire after 7 days if not acted on.

4. **Compound alerts:** when a SKU triggers 3+ alerts simultaneously, sum at-risk $ or model interaction effects? Recommend v1 = sum with a `compound_correction_factor` of ~0.7–0.8 to avoid double-counting; revisit in v2.

5. **Cross-client constant sharing:** opt-in pool or per-client always? Recommend per-client by default; let PMs explicitly promote a constant to global after evidence.

6. **Where Brain admin lives in the customer top nav:** keep sparkles `✨` icon (current) vs. dedicated link. Current is fine.

7. **Cross-link from formula to outcome:** when PM clicks a formula's recent outcome, do we deep-link to the outcome's drawer in the All Outcomes table or navigate to a dedicated outcome page? Recommend deep-link with anchor.

---

## 8. Success criteria for the framework as a whole

| Metric | Target |
|---|---|
| Alerts with full at-risk → realized framework | 8 / 11 in v1 |
| Average accuracy across alerts | within ±25% MAPE |
| PM time to propose a constant change | < 5 minutes (without engineering) |
| Customer trust signal visible on every alert and every outcome | 100% |
| Auto-recalibration loop closes end-to-end | ≥1 successful cycle in Phase 4 |

---

## 9. Dependencies

- L5 outcome pipeline must already compute Shapley decomposition with `primary_metric_share` (per the OCC RCA doc) before Phase 1 can ship
- `brain_outcomes` table needs a `prediction_id` column — simple migration
- Data catalog for the field references (`baseline_daily_OPS`, `LBB%`, etc.) must be unified before Phase 3 (formula authoring would otherwise reference inconsistent fields)

---

## 10. References

### Internal docs
- [Requirements doc (companion)](./2026-05-26-alert-impact-calculation-requirements.md)
- [PR OCC RCA Tree Enhancements](https://docs.google.com/document/d/1sm-mjCr1n7PFRZsVk28-zypf_JTBGwl4l7Hd9CjYQ5g) — Shapley + elasticity math
- [BRAIN.md](../../BRAIN.md) — the 6-layer Brain architecture

### Repo references (files that will be touched)
- [actions.html](../../actions.html) — customer outcome tracker
- [alert.html](../../alert.html) — customer alert detail
- [admin/outcomes.html](../../admin/outcomes.html) — admin playbooks + outcomes
- [admin/adapt.html](../../admin/adapt.html) — L6 learning loops

---

*This plan covers the HOW. For the WHAT — specifically per-alert formulas, design exceptions, calibration plan — see the [companion requirements doc](./2026-05-26-alert-impact-calculation-requirements.md).*
