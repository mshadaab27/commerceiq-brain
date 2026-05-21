/* ============================================================
   CIQ BRAIN — Page renderers.
   Consumes window.BRAIN_DATA + window.BRAIN_HELPERS.
   Renders into [data-render="..."] hooks declared in each page.
   ============================================================ */
(function () {
  'use strict';
  const D = window.BRAIN_DATA;
  const H = window.BRAIN_HELPERS;
  if (!D || !H) return;

  // ---------- icon helpers ----------
  const chevron = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  const chevronDown = '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const chevronRot = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(90deg)"><path d="m6 9 6 6 6-6"/></svg>';
  const arrowR = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  const recallIcon = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 5v4h4"/></svg>';

  // ---------- BRIEFING (index.html) ----------
  function renderBriefing() {
    const root = document.querySelector('[data-render="briefing"]');
    if (!root) return;

    // Filter chip state from sessionStorage (preserves across navigation)
    const filterState = H.loadState('briefing_filter') || { issue: 'All issues', brand: 'All brands', window: 'Last week' };

    const featured = D.alerts.find(a => a.featured) || D.alerts[0];
    const rest = D.alerts.filter(a => a !== featured);

    root.innerHTML = `
      <div class="section-head">
        <h2>Today's briefing</h2>
        <span class="count">${D.alerts.length} alerts</span>
        <div class="right" data-chip-group>
          <button class="chip ${filterState.issue !== 'All issues' ? '' : 'active'}" data-filter="issue">${H.escapeHtml(filterState.issue)} ${chevronDown}</button>
          <button class="chip" data-filter="brand">${H.escapeHtml(filterState.brand)} ${chevronDown}</button>
          <button class="chip" data-filter="window">${H.escapeHtml(filterState.window)} ${chevronDown}</button>
        </div>
      </div>

      <article class="alert-row expanded" data-toggle-drawer="feat" data-alert-id="${featured.id}">
        <div class="alert-main">
          <div class="title">${H.escapeHtml(featured.name)}</div>
          <div class="sub">${H.escapeHtml(featured.teaser)}</div>
        </div>
        <div class="alert-tag">${H.escapeHtml(featured.category)}</div>
        <div class="alert-time">${H.escapeHtml(featured.time)}</div>
        <div class="alert-impact">${H.escapeHtml(featured.gap_label)}</div>
        <div class="arrow">${chevronRot}</div>
      </article>

      <div class="alert-detail" data-drawer="feat">
        ${renderInlineDrawer(featured)}
      </div>

      ${rest.map(a => `
        <a href="./alert.html?id=${encodeURIComponent(a.asin)}" class="alert-row" data-alert-id="${a.id}">
          <div class="alert-main">
            <div class="title">${H.escapeHtml(a.name)}</div>
            <div class="sub">${renderSubLine(a)}</div>
          </div>
          <div class="alert-tag">${H.escapeHtml(a.category)}</div>
          <div class="alert-time">${H.escapeHtml(a.time)}</div>
          <div class="alert-impact${a.issue_type === 'No Issue' ? ' zero' : ''}">${H.escapeHtml(a.gap_label)}</div>
          <div class="arrow">${arrowR}</div>
        </a>
      `).join('')}

      <div class="more"><a href="#">Show 11 more alerts →</a></div>
    `;
  }

  function renderSubLine(a) {
    if (!a.brain_hint) return H.escapeHtml(a.teaser);
    const cls = /\+\d/.test(a.brain_hint) ? 'em-pos' : /pattern|flagged/i.test(a.brain_hint) ? 'em-acc' : 'em-neg';
    return `${H.escapeHtml(a.teaser)} · <span class="${cls}">${H.escapeHtml(a.brain_hint)}</span>`;
  }

  function renderInlineDrawer(a) {
    return `
      <div class="detail-grid">
        <div class="answer">
          <h3>What happened</h3>
          <p>${a.narrative}${a.brain_hint ? ` &nbsp;<span class="hint">${recallIcon} ${H.escapeHtml(a.brain_hint)}</span>` : ''}</p>
          <div class="drivers">
            ${a.drivers.map(d => `
              <div class="driver">
                <div class="ic ${d.state === 'warn' ? 'warn' : d.state === 'zero' ? 'zero' : ''}">${d.state === 'zero' ? '—' : 'ⓘ'}</div>
                <div>
                  <div class="name">${H.escapeHtml(d.name)}</div>
                  <div class="desc">${H.escapeHtml(d.desc)}</div>
                </div>
                <div class="impact ${d.state === 'zero' ? 'zero' : ''}">${H.escapeHtml(d.impact)}</div>
              </div>
            `).join('')}
          </div>
          <a href="./alert.html?id=${encodeURIComponent(a.asin)}" class="btn ghost sm" style="margin-top:18px; padding:8px 14px;">Open full analysis ${arrowR}</a>
        </div>
        <aside class="action-panel">
          <h3>Recommended action</h3>
          <div class="what">${H.escapeHtml(a.recommendation.action)}</div>
          <p class="why">${a.recommendation.why}</p>
          <div class="stats">
            <div class="stat"><div class="l">Expected lift</div><div class="v pos">${H.escapeHtml(a.recommendation.lift)}</div></div>
            <div class="stat"><div class="l">Time to result</div><div class="v">${a.recommendation.days} days</div></div>
          </div>
          <button type="button" class="btn accent full" data-mark-fixed data-alert-id="${a.id}">
            Mark as fixed &amp; track
            ${arrowR}
          </button>
        </aside>
      </div>
    `;
  }

  // ---------- ACTIONS STRIP (index.html) ----------
  function renderActionsStrip() {
    const root = document.querySelector('[data-render="actions-strip"]');
    if (!root) return;

    // Merge persisted user-tracked actions + canonical actions
    const tracked = (H.loadState('tracked_actions') || []).map(t => ({
      name: t.name,
      sku: t.sku,
      asin: t.asin,
      day: 0,
      total: t.days,
      delta_pct: null,
      status: 'Just tracked',
      pill: 'acc',
      note: ''
    }));
    const all = [...tracked, ...D.actions].slice(0, 4);

    root.innerHTML = `
      <div class="section-head" style="border-bottom:0; margin-bottom:0; padding-bottom:0;">
        <h2>Your actions</h2>
        <span class="count">${all.length} in flight</span>
        <div class="right"><a href="./actions.html" class="chip" style="color:var(--ink)">View all →</a></div>
      </div>
      ${all.map(act => {
        const pct = act.total ? Math.round((act.day / act.total) * 100) : 0;
        const isClosed = act.day >= act.total && act.total > 0;
        const delta = act.delta_pct == null
          ? '<span class="delta measuring">measuring…</span>'
          : `<span class="delta">${act.delta_pct > 0 ? '+' : ''}${act.delta_pct}%</span>`;
        const barStyle = isClosed
          ? 'width:100%; background:linear-gradient(90deg,var(--pos),var(--sky));'
          : `width:${pct}%`;
        return `
          <div class="action-line">
            <div class="what">${H.escapeHtml(act.name)}<span class="asin">${H.escapeHtml(act.asin)}</span></div>
            <div class="when">${act.total ? `Day ${act.day} of ${act.total}` : '—'}</div>
            ${delta}
            <div class="bar"><i style="${barStyle}"></i></div>
          </div>
        `;
      }).join('')}
    `;
  }

  // ---------- HERO (index.html) ----------
  function renderHero() {
    const root = document.querySelector('[data-render="hero"]');
    if (!root) return;
    const ctx = D.context;
    const topCat = ctx.category_perf[0];
    const pctOfGap = topCat ? Math.round(Math.abs(topCat.gap) / Math.abs(ctx.brand_totals.ninja.gap) * 100) : 73;
    root.innerHTML = `
      <div class="meta-row">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span class="greet">Good evening, ${H.escapeHtml(ctx.user.name)}</span>
        <span style="color:var(--ink-4)">·</span>
        <span>Today, ${H.escapeHtml(ctx.today)} · ${H.escapeHtml(ctx.tenant)} · ${H.escapeHtml(ctx.region)}</span>
      </div>
      <h1>
        Your business is tracking <span class="neg">${H.fmtMoney(ctx.brand_totals.ninja.gap)} behind plan</span> this week.
        Most of it (${pctOfGap}%) is in ${H.escapeHtml(topCat.name)}.
      </h1>
      <p class="sub">${D.alerts.length} SKUs need attention. ${D.actions.filter(a => a.delta_pct && a.delta_pct > 0).length} of your fixes are already moving the metric — here's what to look at first.</p>
    `;
  }

  // ---------- ALERT DEEP-DIVE (alert.html) ----------
  function renderAlertPage() {
    const root = document.querySelector('[data-render="alert"]');
    if (!root) return;

    const id = H.getQueryParam('id');
    const a = H.getAlert(id) || D.alerts[0];
    if (!a) {
      root.innerHTML = `<div class="empty"><h4>No alert found</h4><p>The alert id <code class="mono">${H.escapeHtml(id)}</code> doesn't match a known SKU. <a href="./index.html" class="acc">Back to briefing</a></p></div>`;
      return;
    }
    document.title = `CommerceIQ · ${a.name}`;

    root.innerHTML = `
      <nav class="breadcrumb">
        <a href="./index.html">Briefing</a>
        <svg class="icon-sm sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
        <span class="here">${H.escapeHtml(a.name)}</span>
      </nav>

      <section class="detail-head">
        <div>
          <h1>${H.escapeHtml(a.full_name || a.name)}</h1>
          <div class="tags">
            <span class="tag">${H.escapeHtml(a.brand)}</span>
            <span class="tag">${H.escapeHtml(a.category)}</span>
            <span class="tag mono">${H.escapeHtml(a.asin)}</span>
            <span class="tag mono">${H.escapeHtml(a.sku_model || '')}</span>
            ${a.brain_hint ? `<span class="tag acc">🧠 ${H.escapeHtml(a.brain_hint)}</span>` : ''}
          </div>
        </div>
        <div>
          <button type="button" class="btn ghost" data-modal-open="action-modal">Mark another action</button>
          <button type="button" class="btn accent" data-mark-fixed data-alert-id="${a.id}">
            Mark as fixed &amp; track
            ${arrowR}
          </button>
        </div>
      </section>

      <div class="kpi-row">
        <div class="kpi">
          <div class="lbl">Last week (${H.escapeHtml(a.kpis.last_week.period)})</div>
          <div class="val neg">${H.fmtMoney(a.kpis.last_week.gap)}</div>
          <div class="sub">${H.fmtMoney(a.kpis.last_week.actual)} of ${H.fmtMoney(a.kpis.last_week.plan)} · ${a.kpis.last_week.attainment}% attainment</div>
        </div>
        <div class="kpi">
          <div class="lbl">WTD (${H.escapeHtml(a.kpis.wtd.period)})</div>
          <div class="val">${H.fmtMoney(a.kpis.wtd.sales)}</div>
          <div class="sub">${a.kpis.wtd.pct_elapsed}% of week elapsed</div>
        </div>
        <div class="kpi">
          <div class="lbl">Projected EOW (${H.escapeHtml(a.kpis.projected.period)})</div>
          <div class="val neg">${H.fmtMoney(a.kpis.projected.gap)}</div>
          <div class="sub">${H.fmtMoney(a.kpis.projected.plan)} plan · ${H.fmtMoney(a.kpis.projected.projected)} proj · ${a.kpis.projected.attainment}%</div>
        </div>
      </div>

      <div class="live-strip">
        <span class="label"><span class="live-dot"></span> Live now</span>
        ${a.live_status.map(s => `
          <span class="pill-status"><span class="d d-${s.state}"></span> ${H.escapeHtml(s.label)} <b>${H.escapeHtml(s.value)}</b></span>
        `).join('')}
      </div>

      <section class="narrative">${a.narrative}</section>

      ${a.unresolved ? `
        <div style="padding:14px 16px; background: var(--neg-tint); border: 1px solid #FBD5E0; border-radius: var(--r-md); display: flex; gap: 12px; align-items:flex-start;">
          <svg class="icon-lg" style="color:var(--neg); flex-shrink:0; margin-top:2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <div style="font-size:13px; color:var(--ink);"><strong>Unresolved today:</strong> ${a.unresolved}</div>
        </div>
      ` : ''}

      <div class="detail-grid-full" style="margin-top:32px;">
        <section>
          <div class="section-head">
            <h2>What drove the gap</h2>
            <span class="count">${a.drivers.length} factors</span>
          </div>
          <div class="drivers" style="margin-top:14px;">
            ${a.drivers.map(d => `
              <div class="driver">
                <div class="ic ${d.state === 'warn' ? 'warn' : d.state === 'zero' ? 'zero' : ''}">${d.state === 'zero' ? '—' : 'ⓘ'}</div>
                <div>
                  <div class="name">${H.escapeHtml(d.name)}</div>
                  <div class="desc">${H.escapeHtml(d.desc)}</div>
                </div>
                <div class="impact ${d.state === 'zero' ? 'zero' : ''}">${H.escapeHtml(d.impact)}</div>
              </div>
            `).join('')}
          </div>

          <div class="section-head" style="margin-top:40px;">
            <h2>Root cause checklist</h2>
            <span class="count">${a.root_causes.flatMap(g => g.items).length} signals</span>
          </div>
          <div style="margin-top:14px; display:flex; flex-direction:column; gap:18px;">
            ${a.root_causes.map(group => `
              <div>
                <div style="font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); font-weight:700; margin-bottom:8px;">${H.escapeHtml(group.group)}</div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${group.items.map(item => `
                    <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--bg); border:1px solid var(--line); border-radius: var(--r-md);">
                      <span class="d d-${item.state === 'ok' ? 'ok' : item.state === 'bad' ? 'bad' : 'warn'}" style="width:7px; height:7px; border-radius:50%;"></span>
                      <span style="flex:1; font-size:13px; font-weight:500;">${H.escapeHtml(item.name)}</span>
                      <span class="pill ${item.status === 'OK' ? 'pill-pos' : item.status === 'Open' ? '' : 'pill-warn'}" style="${item.status === 'Open' ? 'background:var(--neg-tint); color:var(--neg);' : ''}">${H.escapeHtml(item.status)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <aside>
          <div class="action-panel">
            <h3>Recommended action</h3>
            <div class="what">${H.escapeHtml(a.recommendation.action)}</div>
            <p class="why">${a.recommendation.why}</p>
            <div class="stats">
              <div class="stat"><div class="l">Expected lift</div><div class="v pos">${H.escapeHtml(a.recommendation.lift)}</div></div>
              <div class="stat"><div class="l">Time to result</div><div class="v">${a.recommendation.days || '—'}${a.recommendation.days ? ' days' : ''}</div></div>
              <div class="stat" style="grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line);">
                <div class="l">Method</div>
                <div class="v" style="font-size:13px; font-weight:600;">${H.escapeHtml(a.recommendation.method)}</div>
              </div>
            </div>
            <button type="button" class="btn accent full" data-mark-fixed data-alert-id="${a.id}">
              Mark as fixed &amp; track
              ${arrowR}
            </button>
            <button type="button" class="btn ghost full" style="margin-top:8px;" data-modal-open="action-modal">Choose a different action</button>
          </div>

          ${a.history && a.history.length ? `
            <div class="action-panel" style="margin-top: 16px;">
              <h3>Past activity on this SKU</h3>
              <div style="display:flex; flex-direction:column; gap:14px; margin-top:6px;">
                ${a.history.map(h => `
                  <div>
                    <div style="font-weight:600; color: var(--ink); font-size: 13px;">${H.escapeHtml(h.action)} · ${H.escapeHtml(h.when)}</div>
                    <div style="font-size: 12px; color: var(--ink-3); margin-top: 2px;"><span class="${h.state === 'pos' ? 'pos' : 'neg'}" style="font-weight:600">${H.escapeHtml(h.result)}</span></div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${a.root_causes[0].items.find(x => x.detail) ? renderBuyBoxBlock(a.root_causes[0].items.find(x => x.detail)) : ''}
        </aside>
      </div>
    `;
  }

  function renderBuyBoxBlock(item) {
    if (!item.detail) return '';
    const d = item.detail;
    return `
      <div class="action-panel" style="margin-top: 16px;">
        <h3>${H.escapeHtml(item.name)} · detail</h3>
        <p style="font-size:13px; color:var(--ink-2); margin-bottom:14px;">${H.escapeHtml(d.summary)}</p>
        <table style="width:100%; font-size:12px; border-collapse:collapse;">
          <thead>
            <tr>
              <th></th>
              ${d.table.cols.map(c => `<th style="text-align:left; padding:8px 6px; color:var(--ink-3); font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:.08em;">${H.escapeHtml(c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${d.table.rows.map(r => `
              <tr><td style="padding:8px 6px; color:var(--ink-3); border-top:1px solid var(--line); font-size:12px;">${H.escapeHtml(r[0])}</td>${r.slice(1).map(c => `<td style="padding:8px 6px; border-top:1px solid var(--line); font-weight:500; color:var(--ink);">${H.escapeHtml(c)}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ---------- ASK PAGE (ask.html) ----------
  function renderAsk() {
    const sRoot = document.querySelector('[data-render="suggestions"]');
    if (sRoot) {
      const iconMap = {
        target: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>',
        chart:  '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
        clock:  '<path d="M21 12c.552 0 1.018-.447.95-.995A10 10 0 1 0 12 22"/><path d="M12 8v4l3 2"/>',
        alert:  '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
      };
      sRoot.innerHTML = D.suggestions.map(s => `
        <button type="button" class="suggestion" data-suggestion="${H.escapeHtml(s.q)}">
          <div class="ic"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconMap[s.icon] || iconMap.target}</svg></div>
          <div><div class="label">${H.escapeHtml(s.label)}</div><div class="q">${H.escapeHtml(s.q)}</div></div>
        </button>
      `).join('');
    }

    const hRoot = document.querySelector('[data-render="recents"]');
    if (hRoot) {
      hRoot.innerHTML = `
        <div class="section-head">
          <h2>Recent conversations</h2>
          <span class="count">${D.conversations.length}</span>
          <div class="right"><button type="button" class="chip">Search history</button></div>
        </div>
        ${D.conversations.map(c => `
          <a href="./ask.html?thread=${encodeURIComponent(c.id)}" class="alert-row" style="grid-template-columns: 1fr auto auto;">
            <div class="alert-main">
              <div class="title">${H.escapeHtml(c.q)}</div>
              <div class="sub">${c.pinned ? '📌 ' : ''}Routed to <span class="em-acc">${H.escapeHtml(c.routed_to)}</span> · ${H.escapeHtml(c.summary)}</div>
            </div>
            <div class="alert-time">${H.escapeHtml(c.when)}</div>
            <div class="arrow">${arrowR}</div>
          </a>
        `).join('')}
      `;
    }

    // Handle ?thread=cN — show the response inline
    const threadId = H.getQueryParam('thread');
    const tRoot = document.querySelector('[data-render="thread"]');
    if (threadId && tRoot) {
      const conv = D.conversations.find(c => c.id === threadId);
      if (conv) {
        tRoot.innerHTML = renderThread(conv);
        // Hide hero + suggestions when in thread mode
        const hero = document.querySelector('.ask-hero');
        if (hero) hero.style.display = 'none';
        const sug = document.querySelector('.suggestions');
        if (sug) sug.style.display = 'none';
      }
    }
  }

  function renderThread(conv) {
    const isPlanVsActual = conv.routed_to === 'PLAN_VS_ACTUAL';
    if (isPlanVsActual) {
      const r = D.sample_response_plan_vs_actual;
      return `
        <nav class="breadcrumb" style="padding-top:24px;">
          <a href="./ask.html">Ask</a>
          <svg class="icon-sm sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          <span class="here">${H.escapeHtml(conv.q)}</span>
        </nav>

        <div style="display:flex; justify-content:flex-end; margin: 24px 0;">
          <div style="background:var(--accent-tint); color:var(--accent); border-radius: 18px 18px 4px 18px; padding: 12px 18px; max-width: 70%; font-weight:600; font-size:14px;">${H.escapeHtml(conv.q)}</div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span class="pulse-dot"></span>
          <span style="font-size:11px; color:var(--ink-3); text-transform:uppercase; letter-spacing:.1em; font-weight:600;">Routed to ${H.escapeHtml(conv.routed_to)} · 0.92 confidence · 1.4s</span>
        </div>

        <p style="font-size:14px; color:var(--ink); margin-bottom:16px;">${H.escapeHtml(r.intro)}</p>
        <h2 style="font-size:18px; font-weight:700; color:var(--ink); margin: 8px 0 12px;">Plan vs. Actual — Week of May 10–16, 2026</h2>
        <p style="font-size:14px; color:var(--ink); margin-bottom:18px;">${r.headline}</p>

        <div style="font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--ink-3); font-weight:700; margin: 18px 0 8px;">Brand-Level Summary</div>
        ${renderTable(r.brand_table)}

        <div style="font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--ink-3); font-weight:700; margin: 24px 0 4px;">Top Underperforming Sub-Categories</div>
        <p style="font-size:13px; color:var(--ink-3); margin-bottom: 12px;">Showing top 5 by absolute shortfall per brand (negative gap only)</p>

        <h3 style="font-size:14px; font-weight:700; color:var(--ink); margin: 16px 0 8px;">Ninja</h3>
        ${renderTable(r.ninja_subcat)}

        <h3 style="font-size:14px; font-weight:700; color:var(--ink); margin: 16px 0 8px;">Shark</h3>
        ${renderTable(r.shark_subcat)}

        <div style="font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--ink-3); font-weight:700; margin: 24px 0 8px;">Analysis</div>
        <ul style="font-size:14px; color:var(--ink); padding-left:20px; line-height:1.7;">
          ${r.analysis.map(p => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
        </ul>

        <div style="margin-top: 32px; padding: 16px 20px; background: var(--accent-tint); border-radius: var(--r-md); display:flex; gap:12px; align-items:center;">
          <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent); flex-shrink:0;"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
          <div style="font-size:13px; color:var(--ink-2);"><strong style="color:var(--accent)">Want to dig in?</strong> Ask <em>“Why is ice cream maker down?”</em> or <em>“Who are the top underperformers in outdoor grill?”</em></div>
        </div>
      `;
    }
    // RCA_FOR_SKU — link out to the alert page if the ASIN is in the question
    const asinMatch = conv.q.match(/B[0-9A-Z]{9}/i);
    if (asinMatch && H.getAlert(asinMatch[0])) {
      const alert = H.getAlert(asinMatch[0]);
      return `
        <nav class="breadcrumb" style="padding-top:24px;">
          <a href="./ask.html">Ask</a>
          <svg class="icon-sm sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          <span class="here">${H.escapeHtml(conv.q)}</span>
        </nav>
        <div style="display:flex; justify-content:flex-end; margin: 24px 0;">
          <div style="background:var(--accent-tint); color:var(--accent); border-radius: 18px 18px 4px 18px; padding: 12px 18px; max-width: 70%; font-weight:600; font-size:14px;">${H.escapeHtml(conv.q)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px;">
          <span class="pulse-dot"></span>
          <span style="font-size:11px; color:var(--ink-3); text-transform:uppercase; letter-spacing:.1em; font-weight:600;">Routed to ${H.escapeHtml(conv.routed_to)} · 0.94 confidence</span>
        </div>
        <p style="font-size:14px; color:var(--ink); margin-bottom: 20px;">Opening full root cause analysis for <strong>${H.escapeHtml(alert.name)}</strong>…</p>
        <a href="./alert.html?id=${encodeURIComponent(alert.asin)}" class="btn accent">Open analysis ${arrowR}</a>
      `;
    }
    // Fallback
    return `
      <nav class="breadcrumb" style="padding-top:24px;"><a href="./ask.html">Ask</a><svg class="icon-sm sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg><span class="here">${H.escapeHtml(conv.q)}</span></nav>
      <div class="empty" style="margin-top:24px;"><h4>${H.escapeHtml(conv.q)}</h4><p>${H.escapeHtml(conv.summary)}</p></div>
    `;
  }

  function renderTable(rows) {
    if (!rows || !rows.length) return '';
    const [headers, ...body] = rows;
    return `
      <div class="table-wrap" style="margin-top:8px;">
        <table class="table">
          <thead><tr>${headers.map(h => `<th>${H.escapeHtml(h)}</th>`).join('')}</tr></thead>
          <tbody>${body.map(r => `<tr>${r.map((c, i) => {
            const isGap = i === r.length - 1;
            const neg = /^−/.test(String(c));
            const pos = /^\+/.test(String(c));
            const cls = isGap && neg ? 'class="neg tabular" style="font-weight:700"' : isGap && pos ? 'class="pos tabular" style="font-weight:700"' : '';
            return `<td ${cls}>${H.escapeHtml(c)}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  // ---------- ACTIONS PAGE (actions.html) ----------
  function renderActionsPage() {
    const root = document.querySelector('[data-render="actions-page"]');
    if (!root) return;
    const tracked = (H.loadState('tracked_actions') || []);
    const live = D.actions.filter(a => a.day < a.total).length + tracked.length;
    const measured = D.actions.filter(a => a.day >= a.total).length;
    root.innerHTML = `
      <div class="actions-stats">
        <div class="stat"><div class="l">In flight</div><div class="v acc">${live}<span class="unit">actions</span></div></div>
        <div class="stat"><div class="l">Measured this month</div><div class="v">11</div></div>
        <div class="stat"><div class="l">Worked (≥5% lift)</div><div class="v pos">8 <span class="unit">/ 11</span></div></div>
        <div class="stat"><div class="l">Recovered revenue</div><div class="v pos">+$1.8M</div></div>
      </div>
    `;
  }

  // ---------- BRAIN HINT BANNER (alert page — episodic recall) ----------
  function renderRecallBanner() {
    const root = document.querySelector('[data-render="recall-banner"]');
    if (!root) return;
    const id = H.getQueryParam('id');
    const a = H.getAlert(id);
    if (!a || !a.brain_hint || !a.history.length) { root.remove(); return; }
    const lastAction = a.history[0];
    root.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <div style="flex:0 0 32px; width:32px; height:32px; border-radius:8px; background:white; border:1px solid rgba(194,49,255,.18); display:grid; place-items:center; color:var(--accent);">
          ${recallIcon}
        </div>
        <div style="flex:1;">
          <h4 style="font-size:13px; font-weight:700; color:var(--ink); margin-bottom:2px;">We investigated this SKU before.</h4>
          <p style="font-size:13px; color:var(--ink-2);">Last action: <strong>${H.escapeHtml(lastAction.action)}</strong> (${H.escapeHtml(lastAction.when)}) — <span class="${lastAction.state === 'pos' ? 'pos' : 'neg'}" style="font-weight:600">${H.escapeHtml(lastAction.result)}</span>. ${H.escapeHtml(a.brain_hint)}.</p>
        </div>
      </div>
    `;
  }

  // ---------- Init ----------
  function init() {
    renderHero();
    renderBriefing();
    renderActionsStrip();
    renderAlertPage();
    renderRecallBanner();
    renderAsk();
    renderActionsPage();

    // Wire suggestion buttons to navigate
    document.querySelectorAll('[data-suggestion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.suggestion;
        const asinMatch = q.match(/B[0-9A-Z]{9}|NC301/i);
        if (asinMatch) {
          const asin = asinMatch[0] === 'NC301' ? 'B08QXB9BH5' : asinMatch[0];
          window.location.href = './alert.html?id=' + encodeURIComponent(asin);
        } else {
          window.location.href = './ask.html?thread=c1';
        }
      });
    });

    // Override mark-fixed handler to persist tracked actions
    document.querySelectorAll('[data-mark-fixed]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.alertId;
        const a = H.getAlert(id);
        if (!a) return;
        const tracked = (H.loadState('tracked_actions') || []);
        if (!tracked.find(t => t.asin === a.asin)) {
          tracked.unshift({
            asin: a.asin,
            sku: a.name,
            name: a.recommendation.action,
            days: a.recommendation.days,
            tracked_at: Date.now()
          });
          H.saveState('tracked_actions', tracked);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
