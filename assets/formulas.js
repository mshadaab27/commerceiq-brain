/**
 * CIQ BRAIN — Impact Formula Registry
 * ============================================
 *
 * Source of truth for at-risk $ calculation per alert type.
 * Used by the admin Impact Formulas page (admin/outcomes.html#formulas)
 * and by the alert page (alert.html) to render the formula disclosure.
 *
 * Spec:    docs/brainstorms/2026-05-26-alert-impact-calculation-requirements.md
 * Plan:    docs/brainstorms/2026-05-26-impact-tracking-ux-and-platform-plan.md
 *
 * Schema (per formula):
 *   id                  string                              — stable identifier (snake_case)
 *   alert_type          string                              — user-facing alert name
 *   alert_category      "PDP & PROMOS" | "PRODUCT REPUTATION" | "FULFILLMENT" | "SEARCH & TRAFFIC"
 *   primary_metric      "GV" | "CVR" | "ASP" | "OOS_binary" | null
 *   reason              { category, coefficient, confidence }
 *   scope               "global" | "client:<id>" | "product:<id>"
 *   status              "live" | "canary" | "draft" | "demoted" | "directional_only"
 *   version             integer
 *
 *   formula             { primary, fallback?, fallback_when?, where? }
 *   fields              string[]                            — field references the formula reads
 *   constants           constant[]                          — empirical constants needed
 *   measurement         { method, window_days, pre_period_days, min_donor_count, significance_threshold }
 *   validation          { outcomes_count, accuracy_band, accuracy_pct, bias, last_refresh, notes? }
 *   data                { available_now, pending }
 *   used_by             string[]                            — playbook ids that reference this formula
 *   notes               string                              — free text
 *
 *   For status="demoted":          replace `formula` with { demoted: true, reason, treatment, reconsider_when }
 *   For status="directional_only": include `intended_formula` and `blocker` describing what's missing
 *
 * Status counts (v1 launch):
 *   live              4   — Lost Buy Box, Missing Promo Badge, Out of Stock, Keyword Rank Drop, Deal Page Visibility
 *   canary            3   — Shipping Speed, Rating Dropped, Media Spend
 *   demoted           1   — Best Seller Rank Change (context flag only)
 *   directional_only  2   — Review Sentiment, Share of Voice Drop
 *   ---------------
 *   total            11   matches the 11 RCA tree alerts on sharkninja.commerceiq.ai
 */

window.BRAIN_FORMULAS = [

  // ============================================================
  // 1. LOST BUY BOX — CVR
  // ============================================================
  {
    id: "f_lost_buy_box",
    alert_type: "Lost Buy Box",
    alert_category: "PDP & PROMOS",
    primary_metric: "CVR",
    reason: { category: "BuyBox", coefficient: 0.85, confidence: 0.90 },
    scope: "global",
    status: "live",
    version: 3,

    formula: {
      primary:
        "at_risk_$ = days_LBB_projected\n" +
        "          × (pre_LBB_daily_OPS − during_LBB_daily_OPS)",
      fallback:
        "at_risk_$ = pre_LBB_daily_OPS\n" +
        "          × LBB%_observed\n" +
        "          × sub_category_CVR_delta(BB_won → BB_lost)\n" +
        "          × days_projected",
      fallback_when: "no prior LBB event for this SKU"
    },

    fields: [
      "days_LBB_projected",
      "pre_LBB_daily_OPS",
      "during_LBB_daily_OPS",
      "LBB%_observed",
      "sub_category_CVR_delta",
      "days_projected"
    ],

    constants: [],

    measurement: {
      method: "synthetic_control",
      window_days: 7,
      pre_period_days: 14,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 12,
      accuracy_band: "±12%",
      accuracy_pct: 0.88,
      mean_abs_pct_error: 0.114,
      bias: 0.032,
      last_refresh: "2026-05-18"
    },

    data: {
      available_now: ["lbb_status", "lostbuybox_pct", "BUYBOX_SELLER_NAME", "price_diff"],
      pending: []
    },

    used_by: ["pb_lbb_price", "pb_promo_lbb", "pb_multi_lbb"],

    notes:
      "Direct subtraction formula — no constants needed. Naturally high accuracy " +
      "because the math is observed pre/post. Slight positive bias suggests we " +
      "slightly over-predict; recalibration not yet warranted."
  },

  // ============================================================
  // 2. MISSING PROMO BADGE — CVR
  // ============================================================
  {
    id: "f_missing_promo_badge",
    alert_type: "Missing Promo Badge",
    alert_category: "PDP & PROMOS",
    primary_metric: "CVR",
    reason: { category: "Promo", coefficient: 0.80, confidence: 0.85 },
    scope: "global",
    status: "live",
    version: 2,

    formula: {
      primary:
        "at_risk_$ = baseline_promo_uplift_$\n" +
        "          × badge_failure_share\n" +
        "          × promo_days_remaining",
      where:
        "baseline_promo_uplift_$ = historical CVR delta between badge-displayed promos\n" +
        "                          and no-badge baseline for the same SKU\n" +
        "                          (or sub-category if no SKU history)"
    },

    fields: [
      "baseline_promo_uplift_$",
      "badge_failure_share",
      "promo_days_remaining",
      "expected_promo_price",
      "observed_promo_price"
    ],

    constants: [
      {
        key: "badge_presence_CVR_uplift",
        type: "scalar",
        default: 0.18,
        range: [0.15, 0.20],
        scope: "global",
        notes: "Empirical CVR boost when promo badge is displayed vs absent"
      }
    ],

    measurement: {
      method: "synthetic_control",
      window_days: 7,
      pre_period_days: 14,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 8,
      accuracy_band: "±15%",
      accuracy_pct: 0.75,
      last_refresh: "2026-05-18"
    },

    data: {
      available_now: [
        "deal_badge_presence",
        "active_promo_flag",
        "expected_promo_price",
        "observed_promo_price",
        "strike_through_price"
      ],
      pending: []
    },

    used_by: ["pb_deal_badge_7_7", "pb_promo_lbb"]
  },

  // ============================================================
  // 3. DEAL PAGE VISIBILITY — GV
  // ============================================================
  {
    id: "f_deal_page_visibility",
    alert_type: "Deal Page Visibility",
    alert_category: "PDP & PROMOS",
    primary_metric: "GV",
    reason: { category: "Promo", coefficient: 0.80, confidence: 0.85 },
    scope: "global",
    status: "live",
    version: 1,

    formula: {
      primary:
        "at_risk_$ = (expected_GV_from_deal_page − actual_GV_from_deal_page)\n" +
        "          × CVR_baseline\n" +
        "          × ASP_baseline\n" +
        "          × days_off_or_demoted",
      position_weighted_variant:
        "at_risk_$ = Σ_promo_pages [\n" +
        "              baseline_clicks_at_rank_R\n" +
        "              × (1 − CTR_curve(actual_R) / CTR_curve(expected_R))\n" +
        "            ]\n" +
        "          × CVR_baseline × ASP_baseline"
    },

    fields: [
      "deal_page_rank_current",
      "deal_page_rank_baseline",
      "deal_page_traffic_estimate",
      "CVR_baseline",
      "ASP_baseline",
      "days_off_or_demoted"
    ],

    constants: [
      {
        key: "position_CTR_curve_deal_pages",
        type: "curve",
        default: { rank_1: 0.30, rank_5: 0.09, rank_10: 0.03, rank_20: 0.01 },
        scope: "global",
        recalibrate_per_client: true,
        notes: "Position-CTR curve specific to deal pages (steeper than search results)"
      }
    ],

    measurement: {
      method: "synthetic_control",
      window_days: 7,
      pre_period_days: 14,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 4,
      accuracy_band: "±20%",
      accuracy_pct: 0.50,
      last_refresh: "2026-05-14",
      notes: "Wider band — deal page rank scraping is noisy. Need 8+ more outcomes."
    },

    data: {
      available_now: ["deal_page_rank", "active_promo_flag", "deal_badge_presence"],
      pending: ["high_fidelity_deal_page_traffic_attribution"]
    },

    used_by: ["pb_deal_badge_7_7"]
  },

  // ============================================================
  // 4. BEST SELLER RANK CHANGE — DEMOTED (circular)
  // ============================================================
  {
    id: "f_bsr_change",
    alert_type: "Best Seller Rank Change",
    alert_category: "PRODUCT REPUTATION",
    primary_metric: null,
    reason: null,
    scope: "global",
    status: "demoted",
    version: 0,

    formula: {
      demoted: true,
      reason:
        "BSR is an output of sales velocity, not an independent driver. " +
        "Computing $ at risk would double-count whatever caused the velocity drop " +
        "(which is typically one of the other 10 alerts).",
      treatment:
        "Surface as a CONTEXT FLAG on whichever underlying alert caused the BSR move. " +
        "E.g., \"BSR dropped 12 spots, likely driven by Lost Buy Box.\" " +
        "No independent at-risk $ in v1.",
      reconsider_when:
        "DS team proposes a non-circular BSR-to-OPS elasticity model that " +
        "demonstrably separates causal effect from velocity-output noise."
    },

    fields: ["bsr_current", "bsr_baseline_30d", "bsr_delta"],

    data: {
      available_now: ["bsr_current", "bsr_baseline_30d"],
      pending: []
    },

    used_by: []
  },

  // ============================================================
  // 5. RATING DROPPED — CVR (canary, building)
  // ============================================================
  {
    id: "f_rating_dropped",
    alert_type: "Rating Dropped",
    alert_category: "PRODUCT REPUTATION",
    primary_metric: "CVR",
    reason: { category: "Content", coefficient: 0.65, confidence: 0.70 },
    scope: "global",
    status: "canary",
    version: 1,

    formula: {
      primary:
        "at_risk_$ = baseline_daily_OPS\n" +
        "          × CVR_loss_per_rating_point\n" +
        "          × Δrating\n" +
        "          × days_horizon"
    },

    fields: [
      "baseline_daily_OPS",
      "avg_rating_current",
      "avg_rating_baseline_90d",
      "Δrating",
      "days_horizon"
    ],

    constants: [
      {
        key: "CVR_loss_per_0.5_star",
        type: "scalar",
        default: 0.075,
        range: [0.05, 0.10],
        scope: "global",
        varies_by_category: true,
        notes: "Empirical CVR loss per 0.5★ rating drop. Higher for premium SKUs."
      }
    ],

    measurement: {
      method: "pre_post_trend",
      window_days: 14,
      pre_period_days: 90,
      min_donor_count: null,
      significance_threshold: 0.05,
      realized_v1_treatment: "directional_only",
      notes:
        "Rating effects manifest over weeks. Realized side stays directional " +
        "(↑/—/↓) until we have ≥5 outcomes with full measurement window."
    },

    validation: {
      outcomes_count: 2,
      accuracy_band: "n/a (building)",
      last_refresh: "2026-05-14",
      notes: "Need 3+ more outcomes to validate."
    },

    data: {
      available_now: ["avg_rating", "review_count", "rating_baseline_90d"],
      pending: []
    },

    used_by: []
  },

  // ============================================================
  // 6. REVIEW SENTIMENT — DIRECTIONAL ONLY (NLP pending)
  // ============================================================
  {
    id: "f_review_sentiment",
    alert_type: "Review Sentiment",
    alert_category: "PRODUCT REPUTATION",
    primary_metric: "CVR",
    reason: { category: "Content", coefficient: 0.55, confidence: 0.60 },
    scope: "global",
    status: "directional_only",
    version: 0,

    formula: {
      directional_only: true,
      v1_treatment:
        "Surface as 'sentiment trending ↑/—/↓' pill only. " +
        "No precise at-risk $ in v1.",
      intended_formula:
        "at_risk_$ = baseline_daily_OPS\n" +
        "          × neg_sentiment_share\n" +
        "          × CVR_sensitivity\n" +
        "          × days_horizon",
      intended_note:
        "CVR_sensitivity ≈ 0.3 – 0.5× rating sensitivity " +
        "(sentiment is a leading indicator of rating).",
      blocker:
        "SKU-level NLP on review text not productionized. " +
        "Sentiment classifier needs accuracy validation before $ can be computed.",
      reconsider_when: "DS team ships SKU-level review sentiment pipeline"
    },

    fields: [
      "baseline_daily_OPS",
      "neg_sentiment_share",
      "review_recency",
      "review_text"
    ],

    data: {
      available_now: ["review_count", "avg_rating"],
      pending: ["per_sku_sentiment_score", "per_sku_topic_tags"]
    },

    used_by: []
  },

  // ============================================================
  // 7. OUT OF STOCK — OOS-binary (ANCHOR ALERT)
  // ============================================================
  {
    id: "f_out_of_stock",
    alert_type: "Out of Stock",
    alert_category: "FULFILLMENT",
    primary_metric: "OOS_binary",
    reason: { category: "Inventory", coefficient: 1.00, confidence: 0.95 },
    scope: "global",
    status: "live",
    version: 4,

    formula: {
      primary: "at_risk_$ = avg_daily_OPS_pre_OOS × days_OOS_projected"
    },

    fields: [
      "avg_daily_OPS_pre_OOS",
      "days_OOS_projected",
      "is_OOS",
      "is_listed",
      "replenishment_ETA"
    ],

    constants: [],

    measurement: {
      method: "pre_post_simple",
      window_days: 7,
      pre_period_days: 14,
      notes: "OOS is binary — synthetic control is overkill. Simple before/after is correct."
    },

    validation: {
      outcomes_count: 3,
      accuracy_band: "±5%",
      accuracy_pct: 1.00,
      last_refresh: "2026-05-18",
      notes:
        "ANCHOR ALERT — use this to define what 'high accuracy' means. " +
        "Validate the measurement pipeline (pre-period, donor pool, Shapley) " +
        "against OOS outcomes before relying on any other alert's accuracy."
    },

    data: {
      available_now: ["is_OOS", "is_listed", "replenishment_ETA", "daily_OPS"],
      pending: []
    },

    used_by: ["pb_woc_lt_1_week", "pb_replenish_expedite"]
  },

  // ============================================================
  // 8. SHIPPING SPEED — CVR (canary)
  // ============================================================
  {
    id: "f_shipping_speed",
    alert_type: "Shipping Speed",
    alert_category: "FULFILLMENT",
    primary_metric: "CVR",
    reason: { category: "Shipping", coefficient: 0.85, confidence: 0.90 },
    scope: "global",
    status: "canary",
    version: 1,

    formula: {
      primary:
        "at_risk_$ = baseline_daily_OPS\n" +
        "          × CVR_loss_from_shipping_degrade\n" +
        "          × days_at_risk"
    },

    fields: [
      "baseline_daily_OPS",
      "prime_eligible",
      "shipping_window_days",
      "shipping_availability_by_geo",
      "days_at_risk"
    ],

    constants: [
      {
        key: "shipping_degrade_CVR_loss_table",
        type: "table",
        default: {
          prime_to_non_prime: 0.25,        // 20-30% range
          one_two_to_five_seven_days: 0.125, // 10-15%
          not_available_most_geos: 0.45    // 40-50%
        },
        scope: "global",
        notes: "CVR loss by degradation type. Empirical, by industry research + outcomes."
      }
    ],

    measurement: {
      method: "synthetic_control",
      window_days: 7,
      pre_period_days: 14,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 2,
      accuracy_band: "n/a (building)",
      last_refresh: "2026-05-14",
      notes: "Promote to Live after 3+ more outcomes within ±15% accuracy."
    },

    data: {
      available_now: ["prime_eligible", "shipping_window_days", "shipping_availability_by_geo"],
      pending: []
    },

    used_by: []
  },

  // ============================================================
  // 9. SHARE OF VOICE DROP — GV (directional_only)
  // ============================================================
  {
    id: "f_sov_drop",
    alert_type: "Share of Voice Drop",
    alert_category: "SEARCH & TRAFFIC",
    primary_metric: "GV",
    reason: { category: "Media", coefficient: 0.60, confidence: 0.85 },
    scope: "global",
    status: "directional_only",
    version: 0,

    formula: {
      directional_only: true,
      v1_treatment:
        "For clients without SKU-level SOV: surface as 'SOV down ~X%, traffic " +
        "impact estimated' — directional only. " +
        "For clients with full SKU-level SOV data: ship the formula below.",
      intended_formula:
        "at_risk_$ = baseline_GV\n" +
        "          × ΔSOV_share\n" +
        "          × CVR_baseline\n" +
        "          × ASP_baseline\n" +
        "          × days_at_risk",
      alternative_formula:
        "at_risk_$ = (expected_clicks_at_SOV_baseline − actual_clicks_at_current_SOV)\n" +
        "          × CVR × ASP",
      blocker:
        "SKU-level branded/generic SOV split partially blocked for some clients " +
        "(per RCA Variables Missing matrix). Scraping currently covers only top 50 KWs.",
      reconsider_when:
        "Scraping pipeline covers full keyword set per client and SOV is computed " +
        "at SKU level rather than KW level."
    },

    fields: [
      "baseline_GV",
      "ΔSOV_share",
      "CVR_baseline",
      "ASP_baseline",
      "branded_SOV",
      "generic_SOV"
    ],

    data: {
      available_now: ["GV_total", "paid_GV_via_search_clicks"],
      pending: ["branded_SOV_split_at_sku_level", "generic_SOV_split_at_sku_level", "per_sku_keyword_coverage"]
    },

    used_by: []
  },

  // ============================================================
  // 10. KEYWORD RANK DROP — GV
  // ============================================================
  {
    id: "f_kw_rank_drop",
    alert_type: "Keyword Rank Drop",
    alert_category: "SEARCH & TRAFFIC",
    primary_metric: "GV",
    reason: { category: "Media", coefficient: 0.60, confidence: 0.85 },
    scope: "global",
    status: "live",
    version: 2,

    formula: {
      primary:
        "at_risk_$ = Σ_top_keywords [\n" +
        "              baseline_KW_traffic\n" +
        "              × (1 − CTR_curve(current_rank) / CTR_curve(baseline_rank))\n" +
        "            ]\n" +
        "          × CVR_baseline\n" +
        "          × ASP_baseline\n" +
        "          × days_at_risk",
      note: "Sum across top 10–20 P0 keywords for the SKU"
    },

    fields: [
      "kw_rank_organic_current",
      "kw_rank_organic_baseline",
      "kw_rank_paid_current",
      "kw_rank_paid_baseline",
      "baseline_KW_traffic",
      "CVR_baseline",
      "ASP_baseline",
      "days_at_risk"
    ],

    constants: [
      {
        key: "position_CTR_curve_search",
        type: "curve",
        default: { rank_1: 0.30, rank_3: 0.18, rank_5: 0.09, rank_10: 0.03, rank_20: 0.01 },
        scope: "global",
        recalibrate_per_client: true,
        refresh_cadence: "quarterly",
        notes: "Industry default; refresh per client from their observed CTR-by-rank data"
      }
    ],

    measurement: {
      method: "synthetic_control",
      window_days: 14,
      pre_period_days: 30,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 6,
      accuracy_band: "±19%",
      accuracy_pct: 0.80,
      last_refresh: "2026-05-18"
    },

    data: {
      available_now: [
        "kw_rank_organic",  // top 50 KWs
        "kw_rank_paid",     // top 50 KWs
        "kw_traffic_estimate",
        "keyword_p0_list"
      ],
      pending: ["kw_rank_beyond_top_50"]
    },

    used_by: ["pb_kw_rank_media"]
  },

  // ============================================================
  // 11. MEDIA SPEND — GV (canary, accuracy drifting)
  // ============================================================
  {
    id: "f_media_spend",
    alert_type: "Media Spend",
    alert_category: "SEARCH & TRAFFIC",
    primary_metric: "GV",
    reason: { category: "Media", coefficient: 0.60, confidence: 0.85 },
    scope: "global",
    status: "canary",
    version: 2,

    formula: {
      primary:
        "at_risk_$ = ΔSpend\n" +
        "          × historical_iRoAS_for_SKU\n" +
        "          × days_at_risk"
    },

    fields: [
      "current_daily_spend",
      "baseline_daily_spend",
      "ΔSpend",
      "historical_iRoAS_for_SKU",
      "days_at_risk"
    ],

    constants: [
      {
        key: "iRoAS_per_sku",
        type: "per_sku_empirical",
        default: null,
        scope: "per_client",
        refresh_cadence: "rolling_30d",
        notes:
          "Incremental return on ad spend computed daily from spend/revenue ratio " +
          "over last 30 days at SKU level. Volatile; needs refresh logic."
      }
    ],

    measurement: {
      method: "synthetic_control",
      window_days: 14,
      pre_period_days: 30,
      min_donor_count: 10,
      significance_threshold: 0.05
    },

    validation: {
      outcomes_count: 4,
      accuracy_band: "±25%",
      accuracy_pct: 0.50,
      last_refresh: "2026-05-18",
      notes:
        "Wider band — iRoAS itself is volatile (varies by week, campaign, season). " +
        "Watch for L6 recalibration proposal once outcomes count > 8."
    },

    data: {
      available_now: [
        "search_ad_spend",       // per SKU, daily
        "search_RoAS",
        "ad_eligibility_flag"
      ],
      pending: [
        "DSP_spend_per_sku",       // currently KW-level only
        "time_in_budget_pct_per_sku",
        "ad_ineligibility_reasons_per_sku"
      ]
    },

    used_by: [],

    caveats: [
      "Search-only iRoAS in v1 — DSP spend not yet attributed per SKU",
      "Bias toward search-heavy SKUs",
      "iRoAS recalibrates every 30 days; sudden spend changes may lag the constant"
    ]
  }
];

// ============================================================
// Helpers (consumed by admin/outcomes.html and alert.html)
// ============================================================

window.BRAIN_FORMULAS_BY_ID = window.BRAIN_FORMULAS.reduce(function (acc, f) {
  acc[f.id] = f;
  return acc;
}, {});

window.BRAIN_FORMULAS_BY_ALERT = window.BRAIN_FORMULAS.reduce(function (acc, f) {
  acc[f.alert_type] = f;
  return acc;
}, {});

/** Counts by status (matches Impact formulas table on admin page) */
window.BRAIN_FORMULAS_STATUS_COUNT = window.BRAIN_FORMULAS.reduce(function (acc, f) {
  acc[f.status] = (acc[f.status] || 0) + 1;
  return acc;
}, {});
// Expected: { live: 5, canary: 3, demoted: 1, directional_only: 2 }

/** Returns formulas that ship a $ in v1 (status = live | canary) */
window.BRAIN_FORMULAS_SHIPPING = window.BRAIN_FORMULAS.filter(function (f) {
  return f.status === "live" || f.status === "canary";
});
// Expected: 8 formulas

/** Returns the 3 exceptions */
window.BRAIN_FORMULAS_EXCEPTIONS = window.BRAIN_FORMULAS.filter(function (f) {
  return f.status === "demoted" || f.status === "directional_only";
});
// Expected: 3 formulas
