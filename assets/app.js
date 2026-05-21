/* CIQ BRAIN mockup — tiny interactivity layer.
   No framework. No build step. Stays under 200 lines. */
(function () {
  'use strict';

  // --- 1. Search shortcut: ⌘K / Ctrl+K focuses the topbar search input ---
  document.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
      const input = document.querySelector('.search input');
      if (input) { ev.preventDefault(); input.focus(); }
    }
  });

  // --- 2. Filter chips ---
  // For chip groups with [data-chip-group], clicking toggles .active and broadcasts a custom event.
  document.querySelectorAll('[data-chip-group]').forEach(group => {
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.dataset.multi !== 'true') {
          group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        }
        chip.classList.toggle('active');
      });
    });
  });

  // --- 3. Tabs ---
  // [data-tabs] container with <button data-tab="id"> inside. Targets [data-panel="id"].
  document.querySelectorAll('[data-tabs]').forEach(tabs => {
    const panels = document.querySelectorAll('[data-panel]');
    tabs.querySelectorAll('button[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('button[data-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        panels.forEach(p => {
          p.hidden = (p.dataset.panel !== target);
        });
      });
    });
  });

  // --- 4. Modal open/close via [data-modal-open] / [data-modal-close] ---
  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const id = trigger.dataset.modalOpen;
      const m = document.getElementById(id);
      if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(closer => {
    closer.addEventListener('click', () => {
      const m = closer.closest('.modal-shade');
      if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
    });
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document.querySelectorAll('.modal-shade.open').forEach(m => m.classList.remove('open'));
      document.body.style.overflow = '';
    }
  });

  // --- 5. Composer wizard step navigation ---
  // Uses [data-step-next] / [data-step-prev] / [data-step-goto].
  function setStep(n) {
    document.querySelectorAll('[data-step]').forEach(panel => {
      panel.hidden = (parseInt(panel.dataset.step, 10) !== n);
    });
    document.querySelectorAll('.step-pill').forEach(pill => {
      const k = parseInt(pill.dataset.stepPill, 10);
      pill.classList.toggle('active', k === n);
      pill.classList.toggle('done', k < n);
    });
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('[data-step-next]').forEach(b => b.addEventListener('click', () => {
    const cur = parseInt(b.dataset.stepNext, 10);
    setStep(cur + 1);
  }));
  document.querySelectorAll('[data-step-prev]').forEach(b => b.addEventListener('click', () => {
    const cur = parseInt(b.dataset.stepPrev, 10);
    setStep(cur - 1);
  }));
  document.querySelectorAll('[data-step-goto]').forEach(b => b.addEventListener('click', () => {
    setStep(parseInt(b.dataset.stepGoto, 10));
  }));

  // --- 6. "Mark as fixed" demo: shows a toast ---
  function toast(text, kind) {
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast-' + kind : '');
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 250);
    }, 2400);
  }
  window.__toast = toast;

  document.querySelectorAll('[data-mark-fixed]').forEach(b => {
    b.addEventListener('click', () => {
      toast('Action tracked — we will measure for 7 days', 'accent');
      b.disabled = true;
      b.style.opacity = .6;
      b.innerHTML = '✔ Tracking lift…';
    });
  });

  // --- 7. "Generate draft" simulator on Composer ---
  document.querySelectorAll('[data-generate]').forEach(b => {
    b.addEventListener('click', () => {
      const out = document.querySelector('[data-generate-output]');
      if (!out) return;
      out.hidden = false;
      b.disabled = true;
      b.innerHTML = 'Generating…';
      setTimeout(() => {
        b.disabled = false;
        b.innerHTML = '↻ Regenerate';
        toast('Draft generated — review SQL and constraints', 'accent');
      }, 1200);
    });
  });

  // --- 8. Approve/reject in adaptation queue ---
  document.querySelectorAll('[data-approve]').forEach(b => {
    b.addEventListener('click', () => {
      const row = b.closest('tr');
      if (row) row.style.opacity = .5;
      toast('Approved · canary rolled to 10% traffic', 'pos');
    });
  });
  document.querySelectorAll('[data-reject]').forEach(b => {
    b.addEventListener('click', () => {
      const row = b.closest('tr');
      if (row) row.style.opacity = .35;
      toast('Rejected — belief will not be applied', 'neg');
    });
  });

  // --- 9. Inline drawer toggle (alert detail on briefing page) ---
  document.querySelectorAll('[data-toggle-drawer]').forEach(row => {
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('a, button')) return; // let inner links work
      const id = row.dataset.toggleDrawer;
      const drawer = document.querySelector('[data-drawer="' + id + '"]');
      if (!drawer) return;
      const open = !drawer.hasAttribute('hidden');
      drawer.toggleAttribute('hidden');
      row.classList.toggle('expanded', !open);
    });
  });
})();

/* Toast styles injected once. */
(function () {
  if (document.getElementById('__toast_css')) return;
  const s = document.createElement('style');
  s.id = '__toast_css';
  s.textContent = `
  .toast {
    position: fixed; bottom: 28px; left: 50%; transform: translate(-50%, 18px);
    background: #210235; color: white;
    padding: 12px 18px; border-radius: 999px;
    font-size: 13px; font-weight: 500;
    box-shadow: 0 10px 30px rgba(33,2,53,.25);
    opacity: 0; transition: all .25s ease;
    z-index: 200;
  }
  .toast.in { opacity: 1; transform: translate(-50%, 0); }
  .toast-accent { background: linear-gradient(135deg, #C231FF, #6D28D9); }
  .toast-pos { background: #0F9F6E; }
  .toast-neg { background: #D43A6A; }

  .modal-shade {
    display: none; position: fixed; inset: 0;
    background: rgba(33, 2, 53, .35); backdrop-filter: blur(6px);
    z-index: 100; align-items: center; justify-content: center;
    padding: 24px;
  }
  .modal-shade.open { display: flex; animation: fadeIn .2s ease both; }
  .modal {
    background: white; border-radius: 14px; max-width: 560px; width: 100%;
    box-shadow: 0 24px 80px rgba(33,2,53,.30);
    overflow: hidden;
  }
  .modal-head { padding: 20px 22px; border-bottom: 1px solid #EFECF5; display: flex; align-items: center; }
  .modal-head h3 { font-size: 16px; font-weight: 700; color: #210235; }
  .modal-head .x { margin-left: auto; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; color: #7F778F; }
  .modal-head .x:hover { background: #FAF8FC; color: #210235; }
  .modal-body { padding: 22px; }
  .modal-foot { padding: 16px 22px; background: #FAF8FC; border-top: 1px solid #EFECF5; display: flex; justify-content: flex-end; gap: 8px; }
  `;
  document.head.appendChild(s);
})();
