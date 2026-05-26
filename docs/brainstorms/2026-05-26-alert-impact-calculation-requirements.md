# Alert Impact Calculation Framework — Requirements

> **Status:** Requirements (decisions, not implementation)
> **Date:** 2026-05-26
> **Author:** Mohammad Shadaab
> **Stakeholders:** Mudit Gupta (PM, RCA), Ashutosh Kumar (PM, Automation/Attribution), Himanshu Jain (Eng), Nazish Fatima (DS, OCC RCA)
> **Companion plan:** [2026-05-26-impact-tracking-ux-and-platform-plan.md](./2026-05-26-impact-tracking-ux-and-platform-plan.md)

---

## 1. Problem

The SharkNinja agent UI surfaces **11 alert types** per SKU in the Root Cause Analysis tree. Each alert displays a dollar value (the at-risk amount or gap-to-plan), but today:

- The math behind each at-risk $ is inconsistent across alerts
- The at-risk number is **not connected to post-action measurement** (outcome tracker uses Shapley; alerts use ad-hoc heuristics)
- **Predicted vs. realized accuracy is not tracked** — we can't honestly say "we predicted $58K, we delivered $52K"
- PMs and FDEs **can't author or refine** the formulas without engineering involvement

The at-risk dollar reads as a guess, not a commitment. This erodes trust.

## 2. Goal

A unified impact-tracking framework where:

1. Every alert's at-risk $ is computed by a **deterministic, explainable formula** tied to ONE primary metric in `{GV, CVR, ASP, OOS-binary}`
2. Post-action realized $ uses the **same primary metric** via Shapley decomposition + reason coefficient — the math from the [PR OCC RCA doc](https://docs.google.com/document/d/1sm-mjCr1n7PFRZsVk28-zypf_JTBGwl4l7Hd9CjYQ5g)
3. **Predicted vs. realized accuracy** is tracked per alert type and surfaced as a credibility signal
4. The framework **scales**: PMs/FDEs add new alerts or refine existing formulas through the Brain authoring surface without code

## 3. Non-goals

- **Building new attribution math.** We use Shapley + elasticity from the OCC RCA doc unchanged.
- **Real-time recalculation.** Daily refresh is acceptable for v1.
- **Replacing the 11-alert taxonomy.** We work within the existing alert structure.
- **Long-term brand value $.** Stays directional per Ashutosh's transcript guidance for v1.

## 4. The framework

### 4.1 Core identity

```
Every alert  →  primary_metric ∈ {GV, CVR, ASP, OOS_binary}
             +  at_risk_formula (forward projection, manipulates that one metric)
             +  reason_coefficient ∈ [0, 1]  (the share we credit ourselves)

When action is taken:
  realized_credit = shapley_decompose(pre, post, primary_metric) × reason_coefficient
  accuracy        = realized_credit / at_risk_$
```

This identity is the **spine of the data model.** Every alert / playbook / outcome uses these three fields.

### 4.2 The 11 alerts — primary metric mapping (decisions)

| # | Alert | Primary metric | Reason coef. | Data confidence | v1 status |
|---|---|---|---|---|---|
| 1 | Lost Buy Box | CVR | 0.85 | ✅ high | Ship |
| 2 | Missing Promo Badge | CVR | 0.80 | ✅ high | Ship |
| 3 | Deal Page Visibility | GV | 0.80 | ⚠️ medium (rank noisy) | Ship |
| 4 | Best Seller Rank Change | — (context flag) | n/a | ⚠️ circular | **Demote** |
| 5 | Rating Dropped | CVR | 0.65 | ✅ high but slow | Ship (directional realized) |
| 6 | Review Sentiment | CVR | 0.55 | 🚧 NLP uncertain | **Directional only** |
| 7 | Out of Stock | OOS-binary (→ CVR=0) | **1.00** | ✅ deterministic | Ship — anchor alert |
| 8 | Shipping Speed | CVR | 0.85 | ✅ high | Ship |
| 9 | Share of Voice Drop | GV | 0.60 | 🚧 SKU-level partial | **Directional only** |
| 10 | Keyword Rank Drop | GV | 0.60 | ✅ high | Ship |
| 11 | Media Spend | GV | 0.60 | ✅ search, 🚧 DSP partial | Ship (search-only) |

**Net result: 8 of 11 alerts ship with full at-risk → realized formulas in v1.** The remaining 3 ship as exceptions (see §4.4).

### 4.3 Per-alert at-risk formulas

Each formula projects forward to the next 7–14 days, anchored on a clean pre-period baseline.

#### Lost Buy Box → CVR
```
at_risk_$ = days_LBB_projected × (pre_LBB_daily_OPS − during_LBB_daily_OPS)

If no prior LBB event for this SKU, fall back to:
  at_risk_$ = pre_LBB_daily_OPS × LBB%_observed
            × sub_category_CVR_delta(BB_won → BB_lost)
            × days_projected
```

#### Missing Promo Badge → CVR
```
at_risk_$ = baseline_promo_uplift_$ × badge_failure_share × promo_days_remaining

where baseline_promo_uplift_$ = historical CVR delta
      between badge-displayed promos and no-badge baseline
      for the same SKU or sub-category.
```

#### Deal Page Visibility → GV
```
at_risk_$ = (expected_GV_from_deal_page − actual_GV_from_deal_page)
          × CVR_baseline
          × ASP_baseline
          × days_off_or_demoted
```

#### Rating Dropped → CVR
```
at_risk_$ = baseline_daily_OPS
          × CVR_loss_per_rating_point
          × Δrating
          × days_horizon

CVR_loss_per_rating_point ≈ 5–10% per 0.5★ drop (category-specific).
Use 90-day rolling rating baseline to smooth noise.
```

#### Out of Stock → OOS-binary (CVR → 0)
```
at_risk_$ = avg_daily_OPS_pre_OOS × days_OOS_projected

Cleanest formula of the 11. Use as ground-truth calibration anchor.
```

#### Shipping Speed → CVR
```
at_risk_$ = baseline_daily_OPS × CVR_loss_from_shipping_degrade × days_at_risk

CVR-loss table by degradation:
  Prime → non-Prime            ~20–30%
  1–2 day → 5–7 day             ~10–15%
  Not available (most geos)    ~40–50%
```

#### Keyword Rank Drop → GV
```
at_risk_$ = Σ_top_keywords [
              baseline_KW_traffic
              × (1 − CTR_curve(current_rank) / CTR_curve(baseline_rank))
            ]
          × CVR_baseline
          × ASP_baseline
          × days_at_risk

Position-CTR curve (industry default, recalibrate per client):
  rank 1: ~30%   rank 5: ~9%   rank 10: ~3%   rank 20: ~1%
```

#### Media Spend → GV
```
at_risk_$ = ΔSpend × historical_iRoAS_for_SKU × days_at_risk

historical_iRoAS = SKU's empirically observed incremental revenue
                   per dollar of ad spend over last 30 days.
```

### 4.4 Three design exceptions

Not every alert can be reduced to a clean at-risk formula in v1. These need special handling:

| Alert | Why it's an exception | v1 decision |
|---|---|---|
| **Best Seller Rank Change** | Circular — BSR is an *output* of sales velocity, not an independent driver. Computing a $ would double-count whatever caused the velocity drop. | **Demote** from independent alert to **context flag** on whichever underlying alert caused the BSR move. No own at-risk $. Surface as e.g. “BSR dropped 12 spots, likely driven by Lost Buy Box”. |
| **Review Sentiment** | NLP at SKU level is uncertain. Effect on CVR is slow (weeks to months). | **Directional only** — surface as “sentiment trending ↑/↓” until SKU-level NLP is reliable. No precise at-risk $. |
| **Share of Voice Drop** | SKU-level SOV branded/generic split is partly blocked per RCA Variables Missing sheet for some clients. | **Directional at-risk only** for affected clients (“SOV down ~X%, traffic impact estimated”). Precise $ gated behind data readiness. |

## 5. Data requirements

### 5.1 Available now at SKU level (per RCA Variables Missing matrix)

- Glance Views (total + paid via search clicks proxy)
- Conversion (derivable from GV + units)
- ASP
- Promo Rate (binary daily, aggregated)
- Lost Buy Box % (`lbb_status`, `lostbuybox_pct`)
- Out of Stock / Availability (binary daily)
- Avg Rating + Review Count
- KW rank position (organic + paid, top 50 KWs)
- Ad spend (search, SP/SB/SD)

### 5.2 Pending / partial

- DSP clicks at SKU level
- Branded vs Generic SOV split
- Review sentiment (NLP at SKU level)
- Time-in-budget %, ad-ineligibility flags per SKU
- Content score sub-metrics (title/image/bullets/A+) granular per SKU

### 5.3 Empirical constants (calibrate per client, refresh quarterly)

| Constant | Used by | Default | Refresh source |
|---|---|---|---|
| Position-CTR curve | KW Rank Drop | rank 1=30%, 5=9%, 10=3%, 20=1% | Client's historical CTR by rank |
| CVR sensitivity per 0.5★ | Rating Dropped | 5–10% per 0.5★ | Rating-change outcomes in client history |
| Badge presence CVR uplift | Missing Promo Badge | 15–20% | Promo-with-badge vs no-badge outcomes |
| iRoAS per SKU | Media Spend | last 30-day observed | Daily spend / incremental revenue |
| Shipping-degrade CVR loss | Shipping Speed | 20–30% (Prime→non-Prime), 10–15% (speed slip) | Pre/post shipping change outcomes |
| Sub-category CVR delta (BB_won vs BB_lost) | Lost Buy Box (fallback only) | derived per sub-cat | LBB outcomes |

## 6. Calibration plan

1. **Anchor on OOS first.** Inventory has coefficient 1.00 (deterministic). Validate the measurement pipeline (pre-period anchor, donor pool selection, Shapley decomposition) against OOS outcomes before relying on any other alert's accuracy.

2. **Per-alert validation gate.** Each formula needs ≥5 historical outcomes with accuracy within ±30% before being marked Live. Below threshold = Canary only.

3. **Quarterly recalibration.** Empirical constants refresh every quarter via L6 Adapt automation. Triggers a Pending Review item that PMs approve.

4. **Per-client constant overrides.** If a client's constants drift >2 standard deviations from global, propose a client-scoped override (e.g., `client:SharkNinja:position_CTR_curve`).

## 7. Success criteria

| Metric | Target |
|---|---|
| Alerts shipped with full at-risk formula | 8 of 11 (v1) |
| Predicted-vs-realized accuracy (rolling 30 outcomes per alert) | within ±30% on 80% of outcomes |
| At-risk $ visible on every alert in customer UI | 100% (with directional fallback for exception alerts) |
| Accuracy badge visible on every measured outcome | 100% |
| PM/FDE can refine a constant without engineering involvement | true (by Phase 3 — see companion plan) |

## 8. Open questions

1. **Compound alerts.** When a SKU triggers 3+ alerts simultaneously (e.g., Promo + LBB + Shipping), do we sum at-risk $ or model interaction effects? Risk: double-counting if all three contribute to the same OPS drop.

2. **Negative at-risk.** If a SKU is *gaining* OPS (e.g., we won the buy box back, promo is performing), do we track “at-risk-avoided” as a positive impact, or only show losses?

3. **Constant refresh cadence.** Quarterly per-client, or rolling 90-day at the global level? Tradeoff: per-client is more accurate but needs more outcomes per client.

4. **BSR full demote.** Demote BSR Change to context flag entirely, or keep as a standalone alert with no $ (just a directional signal)?

5. **v1 formula authoring.** Hardcoded formulas only (engineering-owned in v1) vs. PM-controlled constants from day one? Lean toward Phase 1 = hardcoded, Phase 3 = PM-controlled. See companion plan.

6. **Cross-client constant sharing.** Should constants learned on one client (e.g., SharkNinja's CTR curve) opt into a shared pool that informs other clients’ priors? Privacy + signal-quality tradeoff.

7. **Prediction expiry.** How long is an at-risk $ valid before recompute? Daily, or live-on-data-refresh?

## 9. Formula registry

All 11 formulas are saved as a structured data file:

**`assets/formulas.js`** — source of truth for the admin Impact Formulas page and the alert at-risk disclosure. Schema documented at the top of the file. Each formula carries: identity, primary metric, reason coefficient, expression(s), field references, constants, measurement plan, validation accuracy, data dependencies, and which playbooks use it.

Status counts in v1:
- `live` — 5 formulas (Lost Buy Box, Missing Promo Badge, Deal Page Visibility, Out of Stock, Keyword Rank Drop)
- `canary` — 3 formulas (Shipping Speed, Rating Dropped, Media Spend)
- `demoted` — 1 formula (Best Seller Rank Change — context flag only)
- `directional_only` — 2 formulas (Review Sentiment, Share of Voice Drop)

**Total: 11**, matching the 11 RCA tree alerts on `sharkninja.commerceiq.ai`.

## 10. References

### Internal docs (CommerceIQ)
- [PR OCC RCA Tree Enhancements](https://docs.google.com/document/d/1sm-mjCr1n7PFRZsVk28-zypf_JTBGwl4l7Hd9CjYQ5g) — Nazish Fatima · canonical attribution math
- [RCA Variables Missing - ACC Only](https://docs.google.com/spreadsheets/d/1cnJWHAGZjcOmhtFp-dS_4Ez6VJJ8_lHF-xtKkMemVp4) — SKU-level data availability matrix
- Strategy Builder Template & Pilot Excel — Ashutosh Kumar · attribution coefficients per reason
- Ashutosh Kumar conversation (2026-05-26) — short-term vs long-term framing, directional long-term for v1
- [PRD: RCA Landing Page API](https://docs.google.com/document/d/1mDKnS3xphlIFuDL_YxP9nxIislQtm7vQTyzNeRutC5A) — Mudit Gupta · gap sort precedence
- [Shark RCA Logic](https://docs.google.com/document/d/1QVMiX7NPBZM9USliRt3qHDYC3vdR4RdRDho6DWihFvA) — Nazish Fatima · 3-step SharkNinja RCA

### Repo references
- [BRAIN.md](../../BRAIN.md) — overall architecture (L1–L6)
- [actions.html](../../actions.html) — current customer outcome tracker
- [admin/outcomes.html](../../admin/outcomes.html) — current admin playbook view

---

*This document captures requirements (the WHAT). For UX flows, admin authoring surfaces, data model additions, and rollout phasing (the HOW), see the [companion plan](./2026-05-26-impact-tracking-ux-and-platform-plan.md).*
