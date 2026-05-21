/* ============================================================
   CIQ BRAIN — Real dataset (scraped from SharkNinja UI)
   Single source of truth for Briefing / Alert / Ask / Actions.
   ============================================================ */
window.BRAIN_DATA = {

  // ---------------------------------------------------------
  // Top-line context for the hero greeting
  // ---------------------------------------------------------
  context: {
    user: { name: "Sarah", role: "CSM", brand_default: "Ninja" },
    tenant: "SharkNinja",
    region: "US",
    retailer: "amazon",
    today: "May 21",
    week: "May 17 – 23",
    overall_gap: -490200,                 // -$490.2K
    brand_totals: {
      ninja: { gap: -1200000, actual: 12370000, plan: 13620000 },
      shark: { gap:  1700000, actual: 14220000, plan: 12480000 }
    },
    category_perf: [
      { name: "Ice cream maker", gap: -764500 },
      { name: "Outdoor grill",   gap: -594500 },
      { name: "Cooler",          gap: -428500 }
    ]
  },

  // ---------------------------------------------------------
  // Briefing alerts (ranked) — real SKUs from SharkNinja
  // ---------------------------------------------------------
  alerts: [
    {
      id: "b08qxb9bh5",
      asin: "B08QXB9BH5",
      sku_model: "NC301",
      brand: "Ninja",
      category: "Ice cream maker",
      retailer: "amazon",
      name: "Ninja NC301 CREAMi Ice Cream Maker",
      full_name: "Ninja NC301 CREAMi Ice Cream Maker, for Gelato, Mix-ins, Milkshakes, Sorbet, Smoothie Bowls & More, 7 One-Touch Programs, with (2) Pint Containers & Lids, Compact Size, Black",
      gap: -359500,
      gap_label: "−$359.5K",
      units: 2755,
      time: "2h ago",
      teaser: "Promo dropped & deal badge missing for the second week running",
      brain_hint: "same pattern flagged 14d ago",
      issue_type: "Lost Buy Box",
      featured: true,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 541800, plan: 901300, attainment: 60.1, gap: -359500 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 234900, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 766700, projected: 494200, gap: -272500, attainment: 64.5 }
      },
      live_status: [
        { label: "BuyBox",         value: "BuyBox Won (amazon.com)",     state: "ok"   },
        { label: "Stock",          value: "In Stock",                    state: "ok"   },
        { label: "Deal Visibility",value: "Badge Missing",               state: "bad"  },
        { label: "Shipping Speed", value: "Not Available (most geos)",   state: "warn" }
      ],
      narrative: "The Ninja NC301 CREAMi (B08QXB9BH5) missed its May 10–16 plan by <strong class='neg'>$359.5K (−40%)</strong>, driven by a <strong>Lost Buy Box</strong> event (3P seller A-Zessentials undercut amazon.com by $13.50 on May 13), a missing deal badge across all 7 days, and an active Matching event failing to register a valid promo price. WTD is tracking at only 47.62% of plan; the current week is on pace for a <strong class='neg'>−$272.5K shortfall</strong> at 64.5% attainment unless the Buy Box is restored.",
      unresolved: "Active Matching event (May 17–23) has <strong>PROMO_VISIBILITY_FAILURE</strong>: deal badge missing on May 17 and 18, list price absent on May 17, selling price mismatched vs expected promo price ($229.99 observed vs $216.49 expected). Immediate escalation required.",
      root_causes: [
        {
          group: "PDP & PROMOS",
          items: [
            { name: "Lost Buy Box",       state: "bad", status: "Open",
              detail: {
                summary: "You've lost the Buy Box on an important SKU.",
                table: {
                  cols: ["amazon.com", "A-Zessentials (Latest Winner)"],
                  rows: [
                    ["Price",         "$229.99",   "$216.49"],
                    ["Availability",  "In Stock",  "In Stock"],
                    ["Ratings",       "—",         "4.6 ★"],
                    ["Buy Box Wins",  "0/1",       "1/1"]
                  ]
                }
              }
            },
            { name: "Missing Promo Badge", state: "ok",  status: "OK" },
            { name: "Deal Page Visibility",state: "ok",  status: "OK" }
          ]
        },
        {
          group: "PRODUCT REPUTATION",
          items: [
            { name: "Best Seller Rank Change", state: "ok", status: "OK" },
            { name: "Rating Dropped",         state: "ok", status: "OK" },
            { name: "Review Sentiment",       state: "ok", status: "OK" }
          ]
        },
        {
          group: "FULFILLMENT",
          items: [
            { name: "Out of Stock",    state: "warn", status: "Needs Attention" },
            { name: "Shipping Speed",  state: "warn", status: "Mixed" }
          ]
        },
        {
          group: "SEARCH & TRAFFIC",
          items: [
            { name: "Share of Voice Drop", state: "ok", status: "OK" },
            { name: "Keyword Rank Drop",   state: "ok", status: "OK" },
            { name: "Media Spend",         state: "ok", status: "OK" }
          ]
        }
      ],
      drivers: [
        { name: "Lost Buy Box",          desc: "3P seller (A-Zessentials) undercut by $13.50 on May 13 · 90% of scrapes", impact: "−$240K", state: "bad" },
        { name: "Deal visibility broken",desc: "Deal badge missing all 7 days · price mismatch vs expected $216.49",      impact: "−$98K",  state: "bad" },
        { name: "Shipping availability", desc: "Not available in most geos for ~3 days",                                  impact: "−$21K",  state: "warn" },
        { name: "Media spend",           desc: "Flat WoW · no rank movement on top keywords",                              impact: "No impact", state: "zero" }
      ],
      recommendation: {
        action: "Restore Buy Box + reset Matching event price",
        why: "Same fix pattern lifted comparable SKUs by 8–15% within 7 days. We'll measure against 12 donor SKUs.",
        lift: "+8 – 15%",
        days: 7,
        method: "Synthetic control · 12 donors"
      },
      history: [
        { when: "14d ago", action: "Fixed deal badge",        result: "+9.2% OPS", state: "pos" },
        { when: "2mo ago", action: "Promo audit",             result: "−4.1%",     state: "neg" },
        { when: "4mo ago", action: "A+ content update",       result: "+5.8%",     state: "pos" }
      ]
    },

    {
      id: "b0dsjw8sfg",
      asin: "B0DSJW8SFG",
      sku_model: "NC701",
      brand: "Ninja",
      category: "Ice cream maker",
      retailer: "amazon",
      name: "Ninja CREAMi Scoop & Swirl Ice Cream Maker",
      full_name: "Ninja CREAMi Scoop & Swirl Ice Cream Maker, Soft Serve Desserts, Sorbet, Milkshakes, Frozen Yogurt and More, 13-in-1 Programs, Includes Handle and Two 16 oz Pint Containers",
      gap: -302300,
      gap_label: "−$302.3K",
      units: 1049,
      time: "3h ago",
      teaser: "Deal badge failed all 7 days last week · NO_ACTIVE_OFFER on listing",
      brain_hint: "your fix is working: +9.2% so far on sibling SKU",
      issue_type: "Lost Buy Box",
      featured: false,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 307300, plan: 609600, attainment: 50.4, gap: -302300 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 82500, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 523500, projected: 173600, gap: -349800, attainment: 33.2 }
      },
      live_status: [
        { label: "BuyBox",         value: "Lost",                       state: "bad"  },
        { label: "Stock",          value: "In Stock",                   state: "ok"   },
        { label: "Deal Visibility",value: "NO_ACTIVE_OFFER",            state: "bad"  },
        { label: "Shipping Speed", value: "Mixed",                      state: "warn" }
      ],
      narrative: "The deal badge failed to display for all 7 days of May 10–16 (Matching promo, observed price $283.64 vs. expected $299.99) while Lost Buy Box peaked at 90% of scrapes on May 13 when Broward Exchange undercut by $47.99, together driving a <strong>$95,527 WoW revenue decline</strong> and a <strong class='neg'>$302K gap vs. plan</strong>. Live scrapes as of May 20 show NO_ACTIVE_OFFER on the listing, which is the primary driver of the projected <strong class='neg'>−66.8% gap to plan</strong> this week ($349,831 shortfall) at only 33.2% attainment.",
      unresolved: "No active SAS offer detected — all live scrapes since May 17 show NO_ACTIVE_OFFER. Current-week sales are severely suppressed until the offer is restored.",
      root_causes: [
        { group: "PDP & PROMOS", items: [
          { name: "Lost Buy Box",        state: "bad", status: "Open" },
          { name: "Missing Promo Badge", state: "ok",  status: "OK" },
          { name: "Deal Page Visibility",state: "ok",  status: "OK" }
        ]},
        { group: "PRODUCT REPUTATION", items: [
          { name: "Best Seller Rank Change", state: "ok", status: "OK" },
          { name: "Rating Dropped",         state: "ok", status: "OK" },
          { name: "Review Sentiment",       state: "ok", status: "OK" }
        ]},
        { group: "FULFILLMENT", items: [
          { name: "Out of Stock",   state: "ok",   status: "OK" },
          { name: "Shipping Speed", state: "warn", status: "Mixed" }
        ]},
        { group: "SEARCH & TRAFFIC", items: [
          { name: "Share of Voice Drop", state: "ok",   status: "OK" },
          { name: "Keyword Rank Drop",   state: "ok",   status: "OK" },
          { name: "Media Spend",         state: "warn", status: "Needs Attention" }
        ]}
      ],
      drivers: [
        { name: "NO_ACTIVE_OFFER status",   desc: "All scrapes since May 17 show no active offer",                              impact: "−$220K", state: "bad" },
        { name: "Deal badge failure",       desc: "Failed all 7 days May 10–16 · observed $283.64 vs expected $299.99",          impact: "−$60K",  state: "bad" },
        { name: "Lost Buy Box",             desc: "Peaked at 90% of scrapes on May 13 · Broward Exchange undercut by $47.99",   impact: "−$22K",  state: "bad" }
      ],
      recommendation: {
        action: "Republish SAS offer + restore Matching event price",
        why: "The sibling SKU got the same fix 4 days ago and is already trending +9.2%. Recommend applying immediately.",
        lift: "+10 – 18%",
        days: 7,
        method: "Synthetic control · 9 donors"
      },
      history: []
    },

    {
      id: "b0b9cz6xbq",
      asin: "B0B9CZ6XBQ",
      sku_model: "NC501",
      brand: "Ninja",
      category: "Ice cream maker",
      retailer: "amazon",
      name: "Ninja CREAMi Deluxe Ice Cream Maker",
      full_name: "Ninja CREAMi Deluxe Ice Cream Maker | 11-in-1 Create Frozen Desserts, Sorbet, Milkshakes",
      gap: -89400,
      gap_label: "−$89.4K",
      units: 416,
      time: "3h ago",
      teaser: "No issue detected — modest under-plan, no actionable signal",
      brain_hint: null,
      issue_type: "No Issue",
      featured: false,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 142000, plan: 231000, attainment: 61.5, gap: -89400 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 38100, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 198000, projected: 80100, gap: -117900, attainment: 40.5 }
      },
      live_status: [
        { label: "BuyBox",         value: "Won",     state: "ok" },
        { label: "Stock",          value: "In Stock", state: "ok" },
        { label: "Deal Visibility",value: "OK",      state: "ok" },
        { label: "Shipping Speed", value: "OK",      state: "ok" }
      ],
      narrative: "The CREAMi Deluxe is tracking <strong class='neg'>$89.4K below plan</strong> for May 10–16. The deterministic checks for Buy Box, promo visibility, OOS, ratings, and search rank all return OK. This appears to be category-wide demand softness rather than a SKU-specific issue.",
      unresolved: null,
      root_causes: [
        { group: "PDP & PROMOS", items: [
          { name: "Lost Buy Box",        state: "ok", status: "OK" },
          { name: "Missing Promo Badge", state: "ok", status: "OK" },
          { name: "Deal Page Visibility",state: "ok", status: "OK" }
        ]},
        { group: "PRODUCT REPUTATION", items: [
          { name: "Best Seller Rank Change", state: "ok", status: "OK" },
          { name: "Rating Dropped",         state: "ok", status: "OK" },
          { name: "Review Sentiment",       state: "ok", status: "OK" }
        ]},
        { group: "FULFILLMENT", items: [
          { name: "Out of Stock",   state: "ok", status: "OK" },
          { name: "Shipping Speed", state: "ok", status: "OK" }
        ]},
        { group: "SEARCH & TRAFFIC", items: [
          { name: "Share of Voice Drop", state: "ok", status: "OK" },
          { name: "Keyword Rank Drop",   state: "ok", status: "OK" },
          { name: "Media Spend",         state: "ok", status: "OK" }
        ]}
      ],
      drivers: [
        { name: "Category softness", desc: "Ice cream maker category is down WoW across all brands", impact: "−$89K", state: "warn" }
      ],
      recommendation: {
        action: "Monitor — no SKU-level action recommended",
        why: "All deterministic signals are healthy. The gap reflects category-wide demand timing.",
        lift: "n/a",
        days: 0,
        method: "n/a"
      },
      history: []
    },

    {
      id: "b0ghpm2c3y",
      asin: "B0GHPM2C3Y",
      sku_model: "PG305",
      brand: "Ninja",
      category: "Outdoor grill",
      retailer: "amazon",
      name: "Ninja FlexFlame ProConnect Grill & Smoker",
      full_name: "Ninja FlexFlame ProConnect Grill & Smoker | 5-in-1 Smart Cooking System | Electric & Propane | PG305",
      gap: -284000,
      gap_label: "−$284.0K",
      units: 388,
      time: "5h ago",
      teaser: "Ad spend flat while top KW rank slipped · repeat pattern, 3× this quarter",
      brain_hint: "repeat pattern, 3× this quarter",
      issue_type: "Media",
      featured: false,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 410000, plan: 694000, attainment: 59.1, gap: -284000 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 121000, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 612000, projected: 391000, gap: -221000, attainment: 63.9 }
      },
      live_status: [
        { label: "BuyBox",         value: "Won",     state: "ok"   },
        { label: "Stock",          value: "In Stock", state: "ok"   },
        { label: "Deal Visibility",value: "OK",      state: "ok"   },
        { label: "Shipping Speed", value: "Mixed",   state: "warn" }
      ],
      narrative: "The FlexFlame ProConnect is down <strong class='neg'>$284K vs. plan</strong> for May 10–16. Ad spend was flat WoW (~$8.2K vs $8.4K prior) while organic rank on the top keyword \"propane grill\" slipped from #11 to #19 and paid rank dropped to #34. This pattern (flat spend + rank loss) has surfaced three times this quarter on this SKU.",
      unresolved: null,
      root_causes: [
        { group: "PDP & PROMOS", items: [
          { name: "Lost Buy Box",        state: "ok", status: "OK" },
          { name: "Missing Promo Badge", state: "ok", status: "OK" },
          { name: "Deal Page Visibility",state: "ok", status: "OK" }
        ]},
        { group: "PRODUCT REPUTATION", items: [
          { name: "Best Seller Rank Change", state: "ok", status: "OK" },
          { name: "Rating Dropped",         state: "ok", status: "OK" },
          { name: "Review Sentiment",       state: "ok", status: "OK" }
        ]},
        { group: "FULFILLMENT", items: [
          { name: "Out of Stock",   state: "ok",   status: "OK" },
          { name: "Shipping Speed", state: "warn", status: "Mixed" }
        ]},
        { group: "SEARCH & TRAFFIC", items: [
          { name: "Share of Voice Drop", state: "warn", status: "Needs Attention" },
          { name: "Keyword Rank Drop",   state: "bad",  status: "Open" },
          { name: "Media Spend",         state: "warn", status: "Needs Attention" }
        ]}
      ],
      drivers: [
        { name: "Keyword rank drop",   desc: "\"propane grill\" #11→#19 organic · paid #34 from #18",   impact: "−$185K", state: "bad" },
        { name: "Flat ad investment",  desc: "Spend flat $8.2K WoW while category competitive intensity ↑", impact: "−$68K",  state: "warn" },
        { name: "Shipping availability",desc: "Mixed availability across geos",                              impact: "−$31K",  state: "warn" }
      ],
      recommendation: {
        action: "Boost ad spend by 30% on \"propane grill\" + 2 other P0 keywords",
        why: "This pattern has produced +6–12% lifts on similar SKUs when caught early. We'll measure for 14 days.",
        lift: "+6 – 12%",
        days: 14,
        method: "Synthetic control · 14 donors"
      },
      history: [
        { when: "6w ago",  action: "Boost ad spend",  result: "+11.3%", state: "pos" },
        { when: "12w ago", action: "Boost ad spend",  result: "+8.1%",  state: "pos" }
      ]
    },

    {
      id: "b0ghpcljl6",
      asin: "B0GHPCLJL6",
      sku_model: "PG301BL",
      brand: "Ninja",
      category: "Outdoor grill",
      retailer: "amazon",
      name: "Ninja FlexFlame Grill and Smoker",
      full_name: "Ninja FlexFlame Grill and Smoker | Electric and Propane Grill | PG301BL",
      gap: -181000,
      gap_label: "−$181.0K",
      units: 240,
      time: "5h ago",
      teaser: "Out of stock 4 of 7 days last week",
      brain_hint: null,
      issue_type: "OOS",
      featured: false,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 220000, plan: 401000, attainment: 54.9, gap: -181000 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 51000, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 350000, projected: 168000, gap: -182000, attainment: 48.0 }
      },
      live_status: [
        { label: "BuyBox",         value: "Won",        state: "ok"   },
        { label: "Stock",          value: "OOS 4/7 days", state: "bad" },
        { label: "Deal Visibility",value: "OK",         state: "ok"   },
        { label: "Shipping Speed", value: "OK",         state: "ok"   }
      ],
      narrative: "PG301BL was <strong class='neg'>out of stock for 4 of 7 days</strong> in May 10–16, with full availability only on May 11, 14, and 15. Lost-sales modeling estimates <strong class='neg'>−$181K</strong> in unrealized revenue. Inventory replenishment ETA is May 23.",
      unresolved: "Stock-out actively suppressing demand. ETA on replenishment: May 23.",
      root_causes: [
        { group: "PDP & PROMOS", items: [
          { name: "Lost Buy Box",        state: "ok", status: "OK" },
          { name: "Missing Promo Badge", state: "ok", status: "OK" },
          { name: "Deal Page Visibility",state: "ok", status: "OK" }
        ]},
        { group: "PRODUCT REPUTATION", items: [
          { name: "Best Seller Rank Change", state: "ok", status: "OK" },
          { name: "Rating Dropped",         state: "ok", status: "OK" },
          { name: "Review Sentiment",       state: "ok", status: "OK" }
        ]},
        { group: "FULFILLMENT", items: [
          { name: "Out of Stock",   state: "bad", status: "Open" },
          { name: "Shipping Speed", state: "ok",  status: "OK" }
        ]},
        { group: "SEARCH & TRAFFIC", items: [
          { name: "Share of Voice Drop", state: "ok", status: "OK" },
          { name: "Keyword Rank Drop",   state: "ok", status: "OK" },
          { name: "Media Spend",         state: "ok", status: "OK" }
        ]}
      ],
      drivers: [
        { name: "Out of stock 4 of 7 days", desc: "Available only on May 11, 14, 15 · replenishment ETA May 23", impact: "−$181K", state: "bad" }
      ],
      recommendation: {
        action: "Expedite replenishment + temporarily pause ad spend on this ASIN",
        why: "No point driving traffic to an OOS listing. Pause spend, then reinstate +10% on day 1 of restock.",
        lift: "+full plan recovery",
        days: 7,
        method: "Pre/post trend"
      },
      history: []
    },

    {
      id: "b0a5cz9jks",
      asin: "B0A5CZ9JKS",
      sku_model: "HD440",
      brand: "Shark",
      category: "Hair care",
      retailer: "amazon",
      name: "Shark FlexStyle Air Styler",
      full_name: "Shark FlexStyle Air Styler & Hair Dryer with Auto-Wrap Curlers and Storage Case",
      gap: -142000,
      gap_label: "−$142K",
      units: 580,
      time: "6h ago",
      teaser: "Glance views down 18% · organic rank slip on \"air styler\"",
      brain_hint: null,
      issue_type: "Search",
      featured: false,
      kpis: {
        last_week: { period: "May 10 – 16", actual: 388000, plan: 530000, attainment: 73.2, gap: -142000 },
        wtd:       { period: "May 17 – 20 (WTD)", sales: 132000, pct_elapsed: 47.62 },
        projected: { period: "May 17 – 23", plan: 495000, projected: 277000, gap: -218000, attainment: 56.0 }
      },
      live_status: [
        { label: "BuyBox",         value: "Won",      state: "ok"   },
        { label: "Stock",          value: "In Stock", state: "ok"   },
        { label: "Deal Visibility",value: "OK",       state: "ok"   },
        { label: "Shipping Speed", value: "OK",       state: "ok"   }
      ],
      narrative: "Glance views are down <strong class='neg'>−18% WoW</strong> for the FlexStyle while organic rank on \"air styler\" slipped from #4 to #9 in week May 10–16. No PDP, promo, or buy-box issues detected. Conversion is steady; this is a top-of-funnel issue.",
      unresolved: null,
      root_causes: [
        { group: "PDP & PROMOS", items: [
          { name: "Lost Buy Box",        state: "ok", status: "OK" },
          { name: "Missing Promo Badge", state: "ok", status: "OK" },
          { name: "Deal Page Visibility",state: "ok", status: "OK" }
        ]},
        { group: "PRODUCT REPUTATION", items: [
          { name: "Best Seller Rank Change", state: "warn", status: "Needs Attention" },
          { name: "Rating Dropped",         state: "ok",   status: "OK" },
          { name: "Review Sentiment",       state: "ok",   status: "OK" }
        ]},
        { group: "FULFILLMENT", items: [
          { name: "Out of Stock",   state: "ok", status: "OK" },
          { name: "Shipping Speed", state: "ok", status: "OK" }
        ]},
        { group: "SEARCH & TRAFFIC", items: [
          { name: "Share of Voice Drop", state: "warn", status: "Needs Attention" },
          { name: "Keyword Rank Drop",   state: "bad",  status: "Open" },
          { name: "Media Spend",         state: "ok",   status: "OK" }
        ]}
      ],
      drivers: [
        { name: "Organic rank slip",  desc: "\"air styler\" #4 → #9 · mid-funnel KW",                  impact: "−$110K", state: "bad"  },
        { name: "Glance views −18%",  desc: "Top-of-funnel traffic loss; conversion steady",          impact: "−$32K",  state: "warn" }
      ],
      recommendation: {
        action: "Boost ad spend on \"air styler\" + add backup keyword \"hair styler\"",
        why: "Recovers organic rank-loss revenue while we wait for organic to settle. 14-day measurement.",
        lift: "+8 – 14%",
        days: 14,
        method: "Synthetic control · 11 donors"
      },
      history: []
    }
  ],

  // ---------------------------------------------------------
  // Actions in flight (Outcome tracker)
  // ---------------------------------------------------------
  actions: [
    {
      name: "Fix promo deal badge",
      asin: "B0DSJW8SFG",
      sku: "Ninja CREAMi Scoop & Swirl",
      day: 4, total: 7,
      delta_pct: 9.2,
      status: "On track",
      pill: "pos",
      note: "The same fix pattern lifted comparable SKUs by 8–15% in 7 days.",
      method: "Synthetic control · 12 donors"
    },
    {
      name: "Reactivate Matching event price",
      asin: "B08QXB9BH5",
      sku: "Ninja CREAMi NC301",
      day: 1, total: 7,
      delta_pct: null,
      status: "Measuring",
      pill: "warn",
      note: "Synthetic baseline built from 9 donor SKUs. Meaningful read by day 4.",
      method: "Synthetic control · 9 donors"
    },
    {
      name: "Boost ad spend on P0 keywords",
      asin: "B0GHPM2C3Y",
      sku: "Ninja FlexFlame ProConnect",
      day: 14, total: 14,
      delta_pct: 11.3,
      status: "Measured",
      pill: "info",
      note: "Closed. Brain belief: media→OPS link strengthened by +0.07 (n=14 obs).",
      method: "Synthetic control · 14 donors"
    }
  ],

  // ---------------------------------------------------------
  // Ask page — chat history + suggestions
  // ---------------------------------------------------------
  suggestions: [
    { label: "Root cause", q: "Why is Ninja CREAMi NC301 tracking below plan this week?",     icon: "target" },
    { label: "Drivers",    q: "Top 5 SKUs driving the gap in outdoor grills last week",        icon: "chart"  },
    { label: "Projection", q: "Are we on track to meet plan for ice cream maker this week?",   icon: "clock"  },
    { label: "Risks",      q: "Which of my top 20 SKUs are losing buy box right now?",         icon: "alert"  }
  ],

  conversations: [
    {
      id: "c1",
      q: "What is my gap to sales plan last week?",
      when: "May 21 · 11:45 AM",
      routed_to: "PLAN_VS_ACTUAL",
      summary: "+$1.06M ahead of plan (+4.0%) · Shark offsetting Ninja shortfall",
      pinned: true
    },
    { id: "c2", q: "Do RCA for B08QXB9BH5",                when: "May 21 · 9:12 AM",  routed_to: "RCA_FOR_SKU",        summary: "NC301: −$359.5K · promo dropoff + LBB · you marked an action" },
    { id: "c3", q: "Run RCA for B00NGV4506",               when: "May 19 · 5:27 PM",  routed_to: "RCA_FOR_SKU",        summary: "Routed to advanced RCA · 5 parallel signals" },
    { id: "c4", q: "What is my gap to sales plan last week?", when: "May 19 · 7:49 PM", routed_to: "PLAN_VS_ACTUAL",     summary: "Plan vs actual brand summary · Shark +$1.7M, Ninja −$1.2M" },
    { id: "c5", q: "Top drivers — outdoor grill",          when: "May 18 · 2:04 PM",  routed_to: "TOP_DRIVERS",        summary: "5 SKUs surfaced · FlexFlame ProConnect leading at −$284K" },
    { id: "c6", q: "Are we on track to plan this week?",    when: "May 18 · 9:30 AM",  routed_to: "RTS_PROJECTION",     summary: "Projected total −$490.2K · Ninja −$1.2M / Shark +$1.7M" },
    { id: "c7", q: "Do RCA for SKU B0D2LZYQ2M",            when: "May 17 · 10:28 PM", routed_to: "RCA_FOR_SKU",        summary: "Ninja Foodi — healthy, no actionable signal" },
    { id: "c8", q: "What is my gap to sales plan last week?", when: "May 14 · 9:29 PM", routed_to: "PLAN_VS_ACTUAL",     summary: "Routed to PLAN_VS_ACTUAL · cached recall" }
  ],

  // ---------------------------------------------------------
  // Sample 'PLAN_VS_ACTUAL' response (used on ask thread page)
  // ---------------------------------------------------------
  sample_response_plan_vs_actual: {
    intro: "Here are the results for last week (May 10–16, 2026):",
    headline: "Overall, you finished <strong>$1.06M ahead of plan (+4.0%)</strong>, driven by a strong Shark overperformance that more than offset a meaningful Ninja shortfall.",
    brand_table: [
      ["Brand", "Planned", "Actual", "Gap"],
      ["Shark", "$12.5M", "$14.2M", "+$1.7M"],
      ["Ninja", "$13.6M", "$12.4M", "−$1.2M"],
      ["Total", "$26.1M", "$27.2M", "+$1.1M"]
    ],
    ninja_subcat: [
      ["Sub-Category", "Planned", "Actual", "Gap"],
      ["Ice Cream Maker",     "$2.2M",  "$1.4M",  "−$764K"],
      ["Outdoor Grill",       "$1.0M",  "$411K",  "−$594K"],
      ["Cooler",              "$684K",  "$255K",  "−$428K"],
      ["Fire Pit",            "$440K",  "$151K",  "−$288K"],
      ["Specialty Drink Maker","$203K", "$15K",   "−$188K"]
    ],
    shark_subcat: [
      ["Sub-Category", "Planned", "Actual", "Gap"],
      ["Fan",         "$1.1M",  "$628K",  "−$499K"],
      ["2-in-1",      "$361K",  "$218K",  "−$143K"],
      ["Skincare",    "$340K",  "$285K",  "−$55K"],
      ["Robotics",    "$1.0M",  "$981K",  "−$38K"],
      ["Steam",       "$791K",  "$770K",  "−$21K"]
    ],
    analysis: [
      "<strong>Ninja is the main risk</strong>, with a <strong class='neg'>−$1.2M shortfall</strong> concentrated in seasonal/outdoor categories — Ice Cream Maker (−$764K), Outdoor Grill (−$594K), Cooler (−$428K), and Fire Pit (−$288K) together account for ~$2.1M of Ninja's gap.",
      "<strong>Shark offset with broad strength</strong>, especially in Uprights (+$977K), Corded Sticks (+$350K), Cordless Sticks (+$278K), Hair Dryer (+$222K), and Extractor (+$196K). The Shark Fan subcategory (−$499K) is the one notable drag."
    ]
  }
};

// ---------------------------------------------------------
// Helpers: lookup, query-string parsing, currency formatting
// ---------------------------------------------------------
window.BRAIN_HELPERS = {
  getAlert(id) {
    if (!id) return null;
    const lower = id.toLowerCase();
    return window.BRAIN_DATA.alerts.find(a => a.id === lower || a.asin.toLowerCase() === lower) || null;
  },
  getQueryParam(name) {
    const m = new URLSearchParams(window.location.search).get(name);
    return m;
  },
  fmtMoney(n) {
    if (n === null || n === undefined) return "—";
    const sign = n < 0 ? "−" : "";
    const abs  = Math.abs(n);
    if (abs >= 1e6) return sign + "$" + (abs/1e6).toFixed(abs >= 10e6 ? 1 : 2) + "M";
    if (abs >= 1e3) return sign + "$" + (abs/1e3).toFixed(1) + "K";
    return sign + "$" + abs.toFixed(0);
  },
  escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  },
  saveState(key, val) {
    try { sessionStorage.setItem("brain_" + key, JSON.stringify(val)); } catch (e) {}
  },
  loadState(key) {
    try { const v = sessionStorage.getItem("brain_" + key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
};
