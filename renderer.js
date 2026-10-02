/* session-card renderer: turns a JSON spec into an end-of-turn status card.
   Runs inside a Claude chat widget. Uses the host's theme CSS variables,
   Tabler outline icons (`ti ti-*`) and the global sendPrompt(text). */
(function () {
  const VERSION = '1.3.0';

  const CSS = `
.sc{display:flex;flex-direction:column;gap:12px;padding:4px 0;font-size:14px;color:var(--text-primary)}
.sc{--sc-you:#7C3AED;--sc-you-b:#F3E8FF;--sc-you-l:#C084FC;--sc-done:#15803D;--sc-done-b:#DCFCE7;--sc-done-l:#4ADE80;--sc-next:#0E7490;--sc-next-b:#CFFAFE;--sc-next-l:#22D3EE;--sc-stop:#BE123C;--sc-stop-b:#FFE4E6;--sc-stop-l:#FB7185}
.sc.sc-dark{--sc-you:#C084FC;--sc-you-b:rgba(192,132,252,.13);--sc-you-l:rgba(192,132,252,.55);--sc-done:#4ADE80;--sc-done-b:rgba(74,222,128,.12);--sc-done-l:rgba(74,222,128,.5);--sc-next:#22D3EE;--sc-next-b:rgba(34,211,238,.12);--sc-next-l:rgba(34,211,238,.5);--sc-stop:#FB7185;--sc-stop-b:rgba(251,113,133,.13);--sc-stop-l:rgba(251,113,133,.55)}
.sc .done{--c:var(--sc-done);--b:var(--sc-done-b);--l:var(--sc-done-l)}.sc .you{--c:var(--sc-you);--b:var(--sc-you-b);--l:var(--sc-you-l)}.sc .next{--c:var(--sc-next);--b:var(--sc-next-b);--l:var(--sc-next-l)}.sc .stop{--c:var(--sc-stop);--b:var(--sc-stop-b);--l:var(--sc-stop-l)}.sc .idle{--c:var(--text-secondary);--b:var(--surface-1);--l:var(--border-strong)}
.sc b{font-weight:500}.sc code{font-family:var(--font-mono);font-size:.92em}.sc button{font:inherit;font-size:13px;cursor:pointer}
.sc-ban{display:flex;align-items:center;gap:16px;padding:16px 18px;border-radius:12px;border:1px solid var(--l);background:var(--b);color:var(--c)}.sc-ic{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;background:var(--surface-2)}.sc-t{font-size:22px;font-weight:500;line-height:1.2}.sc-s{font-size:14px;color:var(--c)}
.sc-bar{display:flex;gap:3px;margin-left:auto;align-self:center}.sc-bar span{width:18px;height:8px;border-radius:2px;background:var(--c)}.sc-bar span.idle{background:var(--border-strong)}
.sc-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.sc-box{background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;padding:14px}.sc-hot{border:2px solid var(--l);padding:12.5px}
.sc-h{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:var(--c);margin-bottom:10px}.sc-n{margin-left:auto;font-size:12px;font-family:var(--font-mono);background:var(--b);color:var(--c);border-radius:10px;padding:1px 8px}
.sc-li{display:flex;gap:8px;line-height:1.45;color:var(--text-secondary);margin-top:8px}.sc-h+.sc-li,.sc-li:first-child{margin-top:0}.sc-li>em{font-style:normal;font-family:var(--font-mono);color:var(--c)}.sc-li b{color:var(--text-primary)}
.sc-cost{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:12px;font-family:var(--font-mono);color:var(--text-muted);white-space:nowrap}.sc-e{display:inline-flex;gap:2px;margin-left:2px}.sc-e s{width:5px;height:5px;border-radius:50%;background:var(--border-strong)}.sc-e s.on{background:var(--text-secondary)}
.sc-fold{margin-top:8px;font-size:13px;color:var(--text-muted)}.sc-fold summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:6px}.sc-fold summary::-webkit-details-marker{display:none}.sc-fold[open] summary i{transform:rotate(90deg)}.sc-fold .sc-li{padding-left:20px}
.sc-pill{display:inline-block;font-size:12px;font-weight:500;background:var(--b);color:var(--c);border-radius:10px;padding:2px 10px;margin-right:6px}.sc-meta{font-size:12px;color:var(--text-muted)}
.sc-step{background:var(--surface-2);border:2px solid var(--l);border-radius:16px;padding:20px 22px}.sc-big{font-size:24px;font-weight:500;line-height:1.25;margin:10px 0 14px}.sc-ck{display:flex;align-items:center;gap:10px;font-size:15px;color:var(--text-secondary);margin-top:8px}.sc-ck input{width:18px;height:18px;flex-shrink:0;accent-color:var(--sc-you)}
.sc-trk{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);padding:6px 0}.sc-trk>div{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;font-size:13px;color:var(--c);text-align:center}.sc-trk>div::before{content:"";position:absolute;top:12px;right:calc(50% + 19px);width:calc(100% - 38px);height:3px;border-radius:2px;background:var(--l)}.sc-trk>div:first-child::before{display:none}.sc-trk i.sc-dot{width:26px;height:26px;border-radius:50%;background:var(--c);color:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:15px;font-style:normal;box-sizing:border-box}.sc-trk .idle i.sc-dot{background:var(--surface-2);border:2px solid var(--border-strong)}.sc-trk .you i.sc-dot{box-shadow:0 0 0 5px var(--b)}.sc-trk .you{font-weight:500}
.sc-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}.sc-tile{background:var(--b);color:var(--c);border-radius:10px;padding:10px 14px;font-size:13px}.sc-tile strong{display:block;font-size:28px;font-weight:500;line-height:1.2}
.sc-rows{background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;overflow:hidden}.sc-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:11px 14px;border-top:0.5px solid var(--border)}.sc-row:first-child{border-top:0}.sc-row.sc-on{background:var(--b)}.sc-row>.sc-tx{flex:1;min-width:160px}.sc-tag{flex-shrink:0;width:58px;text-align:center;font-size:11px;font-weight:500;border-radius:6px;padding:2px 0;background:var(--b);color:var(--c);border:0.5px solid var(--l)}
.sc-note{display:flex;align-items:center;gap:10px;background:var(--b);color:var(--c);border-radius:8px;padding:10px 14px;font-size:13px}.sc-note b{color:var(--c)}
.sc-later{border:0.5px dashed var(--border-strong);border-radius:12px;padding:12px 16px;color:var(--text-secondary)}.sc-later>div:first-child{font-size:13px;font-weight:500;margin-bottom:4px}
.sc-cmd{display:flex;align-items:center;gap:8px;background:var(--surface-1);border-radius:8px;padding:6px 6px 6px 12px;font-family:var(--font-mono);font-size:13px}.sc-cmd code{flex:1;overflow-x:auto;white-space:nowrap}
.sc-act,.sc-chips{display:flex;gap:8px;flex-wrap:wrap}.sc-act .sc-pri{border-color:var(--l);background:var(--b);color:var(--c)}
.sc-back{background:var(--surface-1);border-radius:12px;padding:12px 16px}.sc-bl{display:flex;gap:10px;color:var(--text-secondary);margin-top:4px}.sc-bl>span{width:44px;flex-shrink:0;font-size:12px;color:var(--text-muted);padding-top:2px}.sc-bl.you>span,.sc-bl.you b{color:var(--c)}
.sc-win{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--c)}.sc-win .sc-meta{margin-left:auto}
.sc-exit{display:flex;gap:12px;align-items:flex-start;border:0.5px solid var(--l);border-radius:12px;padding:12px 16px;color:var(--text-secondary)}.sc-exit>i{font-size:20px;color:var(--c)}.sc-exit b{color:var(--text-primary)}
.sc-skip{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text-muted)}.sc-skip b{color:var(--text-secondary)}
.sc-k{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-family:var(--font-mono);padding:3px 10px;border-radius:8px;border:0.5px solid var(--l);background:var(--b);color:var(--c)}
.sc-pr-h{display:flex;align-items:center;gap:8px;color:var(--c)}.sc-pr-h b{color:var(--text-primary);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-pr-m{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;font-size:13px}.sc-pr-m span{display:inline-flex;align-items:center;gap:5px;color:var(--c)}
.sc-ver>div{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:9px 14px;color:var(--text-secondary);border-top:0.5px solid var(--border)}.sc-ver>div:first-child{border-top:0}.sc-ver i{color:var(--c);font-size:18px}.sc-ver span{flex:1;min-width:0}.sc-ver b{color:var(--text-primary);margin-right:6px}.sc-ver code{font-size:12px;color:var(--c)}
.sc-proof{display:flex;flex-direction:column;gap:8px}.sc-proof>div{display:grid;grid-template-columns:84px minmax(0,1fr);column-gap:10px}.sc-proof .sc-meta{grid-column:2}.sc-proof .sc-tag{width:auto;align-self:start}
.sc-env{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.sc-env>div{display:flex;flex-direction:column;gap:2px;background:var(--surface-2);border:0.5px solid var(--border);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--text-secondary)}.sc-env>div::before{content:"";height:3px;border-radius:2px;background:var(--l);margin-bottom:6px}.sc-env b{font-size:14px;color:var(--text-primary)}.sc-env code{color:var(--text-primary)}.sc-env em{font-style:normal;color:var(--c)}
.sc-diff{display:flex;flex-direction:column;gap:6px;font-size:13px}.sc-diff>div{display:grid;grid-template-columns:minmax(0,1fr) auto 60px;gap:10px;align-items:center}.sc-diff code{color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-pm{font-family:var(--font-mono);font-size:12px}.sc-pm ins{text-decoration:none;color:var(--sc-done);margin-right:6px}.sc-pm del{text-decoration:none;color:var(--sc-stop)}.sc-db{display:flex;height:6px;border-radius:3px;overflow:hidden;background:var(--surface-1)}.sc-db i{background:var(--sc-done)}.sc-db s{background:var(--sc-stop)}
.sc-qt{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500;margin-bottom:8px}
.sc-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;margin-top:6px;border:0.5px solid var(--border);border-radius:8px;color:var(--text-secondary);cursor:pointer}.sc-opt input{margin-top:3px}.sc-opt b{color:var(--text-primary)}.sc-opt:has(input:checked){border-color:var(--l);background:var(--b);color:var(--c)}
.sc-seg{display:inline-flex;flex-shrink:0;border:0.5px solid var(--border-strong);border-radius:8px;overflow:hidden}.sc-seg label{padding:4px 10px;font-size:13px;cursor:pointer;color:var(--text-secondary)}.sc-seg label+label{border-left:0.5px solid var(--border-strong)}.sc-seg input{position:absolute;opacity:0;pointer-events:none}.sc-seg label:has(input:checked){background:var(--b);color:var(--c)}.sc-seg label:has(input:focus-visible){outline:2px solid var(--l)}
.sc-in{display:block;width:100%;box-sizing:border-box;margin-top:8px;font:inherit;font-size:14px;padding:8px 10px;border-radius:8px;border:0.5px solid var(--border-strong);background:var(--surface-1);color:var(--text-primary);resize:vertical}.sc-in[aria-invalid=true]{border-color:var(--border-danger)}
.sc-err{font-size:13px;color:var(--text-danger);margin-top:6px}.sc-err:empty{display:none}
.sc-prev{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);white-space:pre-wrap;padding:8px 12px;background:var(--surface-1);border-radius:8px}
.sc-rk{display:flex;align-items:center;gap:6px;padding:6px 0;border-top:0.5px solid var(--border)}.sc-rk:first-of-type{border-top:0}.sc-rk>em{width:22px;font-style:normal;font-family:var(--font-mono);color:var(--c)}.sc-rk>span{flex:1}.sc-rk button{width:30px;height:30px;padding:0}.sc-rk.off>span{color:var(--text-muted);text-decoration:line-through}
.sc-sent .sc-form,.sc-sent .sc-act{opacity:.5;pointer-events:none}
.sc-top{display:flex;flex-direction:column;gap:2px;padding:0 2px 2px}.sc-tt{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:16px;font-weight:500;line-height:1.3}.sc-proj{font-size:11px;font-weight:500;font-family:var(--font-mono);color:var(--text-secondary);background:var(--surface-1);border:0.5px solid var(--border);border-radius:6px;padding:1px 7px}.sc-ab{font-size:13px;line-height:1.45;color:var(--text-secondary)}
@media (max-width:520px){
.sc-ban{flex-wrap:wrap;gap:12px;padding:14px}.sc-ic{width:36px;height:36px;font-size:20px}.sc-ban>div:nth-child(2){flex:1;min-width:0}.sc-t{font-size:19px}.sc-bar{margin-left:0;flex-basis:100%}.sc-bar span{flex:1;max-width:28px}
.sc-step{padding:16px}.sc-big{font-size:20px}.sc-trk>div{font-size:11px}.sc-trk>div::before{right:calc(50% + 16px);width:calc(100% - 32px)}
.sc-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-env{grid-template-columns:minmax(0,1fr)}.sc-proof>div{grid-template-columns:72px minmax(0,1fr)}.sc-diff>div{grid-template-columns:minmax(0,1fr) auto}.sc-db{display:none}
.sc button{min-height:40px}.sc-rk button{width:40px;height:40px}.sc-seg label{padding:9px 12px}.sc-row>.sc-tx{min-width:100%}.sc-act>button{flex:1 1 auto}
}
`;

  const STATES = ['done', 'you', 'next', 'stop', 'idle'];
  const BANNER = {
    you: ['hand-stop', 'Your turn'], done: ['check', 'All done'], next: ['player-play', "Claude's on it"],
    stop: ['alert-triangle', 'Blocked'], idle: ['player-pause', 'Paused'],
  };
  const LANE = {
    done: ['check', 'Done'], you: ['user', 'Your move'], next: ['arrow-right', 'Then Claude'],
    stop: ['alert-triangle', 'Blocked'], idle: ['clock', 'Waiting'],
  };
  const CHECK_ICON = { done: 'circle-check', stop: 'circle-x', you: 'clock', next: 'loader', idle: 'circle-dashed' };
  const GRADE = { observed: 'done', tested: 'done', inferred: 'you', unchecked: 'idle', failed: 'stop' };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Inline markup: **bold** and `code`, everything else escaped.
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  const st = (s, d = 'idle') => (STATES.includes(s) ? s : d);
  const icon = (n, extra = '') => (n ? `<i class="ti ti-${esc(n)}"${extra} aria-hidden="true"></i>` : '');
  const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

  function cost(it) {
    if (!it || (!it.cost && !it.effort)) return '';
    const e = +it.effort || 0;
    const dots = e ? `<i class="sc-e">${[1, 2, 3].map((n) => `<s${n <= e ? ' class="on"' : ''}></s>`).join('')}</i>` : '';
    return `<span class="sc-cost">${it.cost ? icon('clock') + esc(it.cost) : ''}${dots}</span>`;
  }

  function item(it, n) {
    if (typeof it === 'string') it = { text: it };
    const num = it.n ?? n;
    return `<div class="sc-li">${num != null ? `<em>${esc(num)}</em>` : ''}<span>${it.lead ? `<b>${md(it.lead)}</b> ` : ''}${md(it.text)}${cost(it)}${it.meta ? `<div class="sc-meta">${md(it.meta)}</div>` : ''}</span></div>`;
  }

  function items(list, { numbered = false, max = 3, summary } = {}) {
    list = arr(list);
    const shown = list.slice(0, max).map((it, i) => item(it, numbered ? i + 1 : undefined)).join('');
    const rest = list.slice(max);
    if (!rest.length) return shown;
    return shown + `<details class="sc-fold"><summary>${icon('chevron-right')}${esc(summary || `${rest.length} more`)}</summary>${rest.map((it, i) => item(it, numbered ? max + i + 1 : undefined)).join('')}</details>`;
  }

  const button = (b, cls = '') => {
    if (typeof b === 'string') b = { label: b, send: b };
    if (b.copy) return `<button type="button" data-copy="${esc(b.copy)}">${esc(b.label || 'Copy')}</button>`;
    return `<button type="button" class="${b.primary ? 'sc-pri next ' : ''}${cls}" data-p="${esc(b.send || b.label)}">${esc(b.label)} ↗</button>`;
  };

  // Question blocks register here; the footer collects them into one message.
  function renderBlocks(spec, ctx) {
    const B = {
      banner(b) {
        const s = st(b.state, 'you');
        const [ic, title] = BANNER[s];
        const bar = arr(b.bar).length >= 3 ? `<div class="sc-bar">${b.bar.map((x) => `<span class="${st(x)}"></span>`).join('')}</div>` : '';
        return `<div class="sc-ban ${s}"><div class="sc-ic">${icon(b.icon || ic)}</div><div><div class="sc-t">${md(b.title || title)}</div>${b.sub ? `<div class="sc-s">${md(b.sub)}</div>` : ''}</div>${bar}</div>`;
      },
      back(b) {
        const row = (k, v, cls = '') => (v ? `<div class="sc-bl ${cls}"><span>${k}</span>${cls ? `<b>${md(v)}</b>` : md(v)}</div>` : '');
        return `<div class="sc-back idle"><div class="sc-h">${icon('history')}Where you left off${b.ago ? `<span class="sc-meta" style="margin-left:auto">${esc(b.ago)}</span>` : ''}</div>${row('Doing', b.doing)}${row('Last', b.last)}${row('Now', b.now, 'you')}</div>`;
      },
      lanes(b) {
        return `<div class="sc-cols">${arr(b.lanes).map((l) => {
          const s = st(l.state);
          const [ic, title] = LANE[s];
          const list = arr(l.items);
          return `<div class="sc-box ${s}${l.hot ? ' sc-hot' : ''}"><div class="sc-h">${icon(l.icon || ic)}${md(l.title || title)}<span class="sc-n">${list.length}</span></div>${items(list, { numbered: s === 'you' && list.length > 1, summary: l.foldSummary })}</div>`;
        }).join('')}</div>`;
      },
      step(b) {
        const s = st(b.state, 'you');
        const checks = arr(b.checks);
        let body = checks.map((c, i) => `<label class="sc-ck"><input type="checkbox" value="${esc(c.value || c.text || c)}" data-i="${i}">${md(c.text || c)}</label>`).join('');
        let open = `<div class="sc-step ${s}">`;
        if (b.report) {
          const id = ctx.q({ kind: 'ticks', label: b.q || b.title });
          open = `<div class="sc-step sc-form ${s}" data-qid="${id}">`;
          body += `<textarea class="sc-in" rows="2" placeholder="${esc(b.placeholder || 'What went wrong (if anything)')}"></textarea>`;
        }
        return `${open}<span class="sc-pill">${esc(b.label || 'Your one next step')}</span>${cost(b)}<div class="sc-big">${md(b.title)}</div>${body}</div>`;
      },
      track(b) {
        return `<div class="sc-trk">${arr(b.stages).map((x) => {
          const s = st(x.state);
          const ic = s === 'done' ? icon('check') : s === 'you' ? icon('user') : s === 'next' ? icon('player-play') : s === 'stop' ? icon('x') : '';
          return `<div class="${s}"><i class="sc-dot">${ic}</i>${md(x.label)}</div>`;
        }).join('')}</div>`;
      },
      tiles(b) {
        return `<div class="sc-tiles">${arr(b.tiles).map((t) => `<div class="sc-tile ${st(t.state)}">${md(t.label)}<strong>${esc(t.value)}</strong></div>`).join('')}</div>`;
      },
      rows(b) {
        return `<div class="sc-rows">${arr(b.rows).map((r) => {
          const s = st(r.state);
          const tag = r.tag || { done: 'Done', you: 'You', next: 'Claude', stop: 'Blocked', idle: 'Later' }[s];
          return `<div class="sc-row ${s}${r.hot ?? s === 'you' ? ' sc-on' : ''}"><span class="sc-tag">${esc(tag)}</span><span class="sc-tx">${md(r.text)}${cost(r)}</span>${arr(r.buttons).map((x) => button(x)).join('')}</div>`;
        }).join('')}</div>`;
      },
      note: (b) => `<div class="sc-note ${st(b.state, 'stop')}">${icon(b.icon || (b.state === 'next' ? 'info-circle' : 'alert-triangle'))}<span>${md(b.text)}</span></div>`,
      later: (b) => `<div class="sc-later"><div>${md(b.title || 'Ideas for later, no rush')}</div>${b.text ? md(b.text) : items(b.items, { max: 5 })}</div>`,
      cmd: (b) => `<div class="sc-cmd"><code>${esc(b.cmd)}</code><button type="button" data-copy="${esc(b.cmd)}">Copy</button></div>`,
      chips: (b) => `<div class="sc-chips">${arr(b.chips).map((c) => `<span class="sc-pill ${st(c.state)}">${md(c.text)}</span>`).join('')}</div>`,
      meta: (b) => `<div class="sc-meta">${md(b.text)}</div>`,
      win: (b) => `<div class="sc-win ${st(b.state, 'done')}">${icon('trending-up')}<span>${md(b.text)}</span>${b.meta ? `<span class="sc-meta">${md(b.meta)}</span>` : ''}</div>`,
      exit: (b) => `<div class="sc-exit ${st(b.state, 'idle')}">${icon(b.icon || (b.state === 'stop' ? 'alert-octagon' : b.state === 'next' ? 'hourglass' : 'door-exit'))}<div>${md(b.text)}${b.sub ? `<div class="sc-meta">${md(b.sub)}</div>` : ''}</div></div>`,
      skip: (b) => `<div class="sc-skip">${icon('eye-off')}<span><b>Safe to ignore:</b> ${md(b.text)}</span></div>`,
      fold: (b) => `<details class="sc-fold"><summary>${icon('chevron-right')}${md(b.summary)}</summary>${arr(b.items).map((x) => item(x)).join('')}</details>`,
      git(b) {
        const k = (s, ic, t) => `<span class="sc-k ${s}">${icon(ic)}${t}</span>`;
        const out = [];
        if (b.branch) out.push(k('idle', 'git-branch', `<code style="color:var(--text-primary)">${esc(b.branch)}</code>`));
        if (b.worktree) out.push(k('idle', 'folders', esc(b.worktree)));
        if (b.ahead) out.push(k('done', 'arrow-up', `${esc(b.ahead)} ahead`));
        if (b.behind) out.push(k('you', 'arrow-down', `${esc(b.behind)} behind ${esc(b.base || 'main')}`));
        if (b.dirty) out.push(k(st(b.dirtyState, 'you'), 'pencil', `${esc(b.dirty)} uncommitted`));
        else if (b.dirty === 0) out.push(k('done', 'check', 'Clean'));
        if (b.merged === true) out.push(k('done', 'git-merge', 'Merged'));
        if (b.merged === false) out.push(k('idle', 'git-merge', 'Not merged'));
        return `<div><div class="sc-chips" style="gap:6px">${out.join('')}</div>${b.asOf ? `<div class="sc-meta" style="margin-top:6px">${md(b.asOf)}</div>` : ''}</div>`;
      },
      pr(b) {
        const s = st(b.state, 'next');
        return `<div class="sc-box ${s}" style="border-color:var(--l)"><div class="sc-pr-h">${icon('git-pull-request')}<code>#${esc(b.number)}</code><b>${md(b.title)}</b><span class="sc-pill">${esc(b.status || 'Open')}</span></div>${arr(b.meta).length ? `<div class="sc-pr-m">${b.meta.map((m) => `<span class="${st(m.state)}">${icon(m.icon || CHECK_ICON[st(m.state)])}${md(m.text)}</span>`).join('')}</div>` : ''}</div>`;
      },
      checks(b) {
        return `<div class="sc-rows sc-ver">${b.title ? `<div class="idle"><b>${md(b.title)}</b></div>` : ''}${arr(b.rows).map((r) => {
          const s = st(r.state);
          return `<div class="${s}">${icon(CHECK_ICON[s])}<span><b>${md(r.name)}</b>${r.scope ? md(r.scope) : ''}</span>${r.evidence ? `<code>${esc(r.evidence)}</code>` : ''}</div>`;
        }).join('')}</div>`;
      },
      proof(b) {
        return `<div class="sc-proof">${arr(b.rows).map((r) => {
          const g = String(r.grade || 'unchecked').toLowerCase();
          return `<div><span class="sc-tag ${GRADE[g] || 'idle'}">${esc(g[0].toUpperCase() + g.slice(1))}</span><span>${md(r.text)}</span>${r.how ? `<span class="sc-meta">${md(r.how)}</span>` : ''}</div>`;
        }).join('')}</div>`;
      },
      env(b) {
        return `<div class="sc-env">${arr(b.envs).map((e) => `<div class="${st(e.state)}"><b>${md(e.name)}</b>${e.where ? `<span>${md(e.where)}</span>` : ''}${e.version ? `<code>${esc(e.version)}</code>` : ''}${e.status ? `<em>${md(e.status)}</em>` : ''}</div>`).join('')}</div>`;
      },
      diff(b) {
        const files = arr(b.files);
        const max = Math.max(1, ...files.map((f) => (+f.add || 0) + (+f.del || 0)));
        return `<div><div class="sc-diff">${files.map((f) => `<div><code title="${esc(f.path)}">${esc(f.path)}</code><span class="sc-pm"><ins>+${+f.add || 0}</ins><del>−${+f.del || 0}</del></span><span class="sc-db"><i style="width:${Math.round(((+f.add || 0) / max) * 100)}%"></i><s style="width:${Math.round(((+f.del || 0) / max) * 100)}%"></s></span></div>`).join('')}</div>${b.meta ? `<div class="sc-meta" style="margin-top:6px">${md(b.meta)}</div>` : ''}</div>`;
      },
      risk(b) {
        const s = st(b.state, b.irreversible ? 'stop' : 'you');
        return `<div class="sc-box ${s}" style="border-color:var(--l)"><div class="sc-h">${icon('shield-exclamation')}${md(b.title || 'Risk and rollback')}${b.irreversible ? '<span class="sc-pill" style="margin-left:auto">Irreversible</span>' : ''}</div>${items(b.items, { max: 6 })}${b.rollback ? `<div class="sc-cmd" style="margin-top:10px"><code>${esc(b.rollback)}</code><button type="button" data-copy="${esc(b.rollback)}">Copy</button></div>` : ''}</div>`;
      },
      actions: (b) => `<div class="sc-act">${arr(b.buttons).map((x) => button(x)).join('')}</div>`,

      decide(b) {
        const id = ctx.q({ kind: 'radio', label: b.q || b.title, req: b.required !== false, other: !!b.other });
        const opts = arr(b.options).map((o) => {
          if (typeof o === 'string') o = { label: o };
          if (o.rec) ctx.hasRec = true;
          return `<label class="sc-opt"><input type="radio" name="${id}" value="${esc(o.value || o.label)}"${o.rec ? ' data-rec checked' : ''}><span><b>${md(o.label)}</b>${o.rec ? ' <span class="sc-pill next">Recommended</span>' : ''}${o.why ? `<br>${md(o.why)}` : ''}</span></label>`;
        }).join('');
        return `<div class="sc-box sc-form ${st(b.state, 'you')} sc-hot" data-qid="${id}"><div class="sc-qt">${icon(b.icon || 'arrows-split')}${md(b.title)}</div>${opts}${b.other ? `<input class="sc-in" placeholder="${esc(b.otherPlaceholder || 'Anything to add (optional)')}">` : ''}<div class="sc-err"></div></div>`;
      },
      ask(b) {
        const choices = arr(b.choices).length ? b.choices : ['Yes', 'No', 'Later'];
        const cls = ['done', 'stop', 'idle', 'next'];
        return `<div class="sc-rows sc-form">${arr(b.questions).map((q) => {
          const id = ctx.q({ kind: 'radio', label: q.q || q.text, req: !!q.required });
          const seg = choices.map((c, i) => {
            const rec = q.rec && String(q.rec).toLowerCase() === String(c).toLowerCase();
            if (rec) ctx.hasRec = true;
            return `<label class="${cls[i % 4]}"><input type="radio" name="${id}" value="${esc(String(c).toLowerCase())}"${rec ? ' data-rec' : ''}>${esc(c)}</label>`;
          }).join('');
          return `<div class="sc-row ${st(q.state, 'you')}" data-qid="${id}"><span class="sc-tx">${md(q.text)}${cost(q)}</span><span class="sc-seg">${seg}</span><div class="sc-err" style="flex-basis:100%"></div></div>`;
        }).join('')}</div>`;
      },
      reply(b) {
        const id = ctx.q({ kind: 'text', label: b.q || b.title, min: b.min || 0, msg: b.minMessage });
        return `<div class="sc-box sc-form ${st(b.state, 'you')} sc-hot" data-qid="${id}"><div class="sc-qt">${icon(b.icon || 'message')}${md(b.title)}</div><textarea class="sc-in" rows="${b.rows || 3}" placeholder="${esc(b.placeholder || '')}"></textarea><div class="sc-err"></div><div class="sc-meta" style="margin-top:6px">Cmd+Enter sends</div></div>`;
      },
      approve(b) {
        const id = ctx.q({ kind: 'approve', label: b.q || b.title });
        ctx.hasRec = true;
        return `<div class="sc-box sc-form ${st(b.state, 'you')} sc-hot" data-qid="${id}"><div class="sc-qt">${icon(b.icon || 'file-check')}${md(b.title)}</div>${b.text ? `<div class="sc-li" style="margin-bottom:10px">${md(b.text)}</div>` : ''}<span class="sc-seg"><label class="done"><input type="radio" name="${id}" value="approved" data-rec checked>Approve</label><label class="you"><input type="radio" name="${id}" value="approved with a change">With a tweak</label><label class="stop"><input type="radio" name="${id}" value="rejected">No</label></span><div data-when="approved with a change" hidden><input class="sc-in" placeholder="${esc(b.tweakPlaceholder || 'Change…')}"></div><div class="sc-err"></div></div>`;
      },
      rank(b) {
        const id = ctx.q({ kind: 'rank', label: b.q || b.title || 'Order for next steps' });
        return `<div class="sc-box sc-form ${st(b.state, 'next')}" data-qid="${id}"><div class="sc-qt">${icon('list-numbers')}${md(b.title || 'What first?')}</div>${arr(b.items).map((x, i) => {
          if (typeof x === 'string') x = { label: x };
          return `<div class="sc-rk" data-v="${esc(x.value || x.label)}"><em>${i + 1}</em><span>${md(x.label)}</span><button type="button" data-mv="-1" aria-label="Move up">${icon('chevron-up')}</button><button type="button" data-mv="1" aria-label="Move down">${icon('chevron-down')}</button><button type="button" data-mv="x" aria-label="Drop or restore">${icon('x')}</button></div>`;
        }).join('')}</div>`;
      },
      park(b) {
        return B.ask({ questions: arr(b.items).map((x) => ({ state: 'idle', rec: 'park', ...x })), choices: ['Now', 'Park', 'Drop'] }) + (b.parkAll ? `<div class="sc-act">${button({ label: 'Park all and stop', send: b.parkAll })}</div>` : '');
      },
    };
    return arr(spec.blocks).map((b) => {
      const fn = B[b && b.type];
      return fn ? fn(b) : '';
    }).join('');
  }

  function wire(root, spec, ctx) {
    const qel = (q) => root.querySelector(`[data-qid="${q.id}"]`);
    const textOf = (el) => {
      const t = el.querySelector('.sc-in');
      return t && !t.closest('[hidden]') ? t.value.trim() : '';
    };
    const value = (q) => {
      const el = qel(q);
      if (!el) return '';
      if (q.kind === 'rank') {
        const rows = [...el.querySelectorAll('.sc-rk')];
        const on = rows.filter((r) => !r.classList.contains('off')).map((r, i) => `${i + 1}) ${r.dataset.v}`);
        const off = rows.filter((r) => r.classList.contains('off')).map((r) => r.dataset.v);
        return on.join(', ') + (off.length ? `; drop: ${off.join(', ')}` : '');
      }
      if (q.kind === 'ticks') {
        const c = [...el.querySelectorAll('input[type=checkbox]')];
        const list = (b) => c.filter((i) => i.checked === b).map((i) => i.value).join(', ') || 'none';
        const t = textOf(el);
        return `worked: ${list(true)}; failed or not tried: ${list(false)}${t ? `. ${t}` : ''}`;
      }
      if (q.kind === 'text') return textOf(el);
      const r = el.querySelector('input[type=radio]:checked');
      let v = r ? r.value + (r.hasAttribute('data-rec') ? ' (your recommendation)' : '') : '';
      const t = textOf(el);
      if (t) v += (v ? '. ' : '') + t;
      return v;
    };
    const problem = (q) => {
      const el = qel(q);
      const v = value(q);
      if (q.req && !v) return 'Pick one first.';
      if (q.kind === 'text' && q.min && v.length < q.min) return q.msg || `A few more words, at least ${q.min} characters.`;
      if (q.kind === 'approve' && el.querySelector('input:checked')?.value === 'approved with a change' && !textOf(el)) return 'Say what to change.';
      return '';
    };
    const send = spec.send || {};
    const message = () => [send.intro || 'My answers:', ...ctx.qs.map((q) => `- ${q.label}: ${value(q) || 'skipped'}`), send.go].filter(Boolean).join('\n');
    const prev = root.querySelector('.sc-prev');
    const update = () => {
      ctx.qs.forEach((q) => {
        const el = qel(q);
        el?.querySelectorAll('[data-when]').forEach((w) => { w.hidden = el.querySelector('input:checked')?.value !== w.dataset.when; });
        el?.querySelectorAll('.sc-rk').forEach((r, _, all) => { const on = [...all].filter((x) => !x.classList.contains('off')); r.querySelector('em').textContent = r.classList.contains('off') ? '–' : on.indexOf(r) + 1; });
      });
      if (prev) prev.textContent = message();
    };
    const go = (text) => {
      if (typeof sendPrompt === 'function') sendPrompt(text);
      else console.log('[session-card] sendPrompt:', text);
      root.classList.add('sc-sent');
    };
    const submit = (btn) => {
      let first = null;
      ctx.qs.forEach((q) => {
        const el = qel(q);
        const p = problem(q);
        el.querySelectorAll('.sc-err').forEach((e) => { e.textContent = p; });
        el.querySelector('.sc-in')?.setAttribute('aria-invalid', p ? 'true' : 'false');
        if (p && !first) first = el;
      });
      if (first) return first.querySelector('input,textarea')?.focus();
      go(message());
      btn.textContent = 'Sent';
    };
    root.addEventListener('change', update);
    root.addEventListener('input', (e) => {
      const el = e.target.closest('[data-qid]');
      el?.querySelectorAll('.sc-err').forEach((x) => { x.textContent = ''; });
      e.target.removeAttribute?.('aria-invalid');
      update();
    });
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t || root.classList.contains('sc-sent') && !t.dataset.copy) return;
      if (t.dataset.mv) {
        const row = t.closest('.sc-rk');
        const d = t.dataset.mv;
        if (d === 'x') row.classList.toggle('off');
        else if (d === '-1' && row.previousElementSibling?.classList.contains('sc-rk')) row.previousElementSibling.before(row);
        else if (d === '1' && row.nextElementSibling?.classList.contains('sc-rk')) row.nextElementSibling.after(row);
        update();
      } else if (t.dataset.copy != null) {
        navigator.clipboard?.writeText(t.dataset.copy);
        t.textContent = 'Copied';
      } else if (t.hasAttribute('data-fill')) {
        root.querySelectorAll('input[data-rec]').forEach((i) => { i.checked = true; });
        update();
      } else if (t.hasAttribute('data-send')) {
        submit(t);
      } else if (t.dataset.p) {
        go(t.dataset.p);
      }
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const b = root.querySelector('[data-send]');
        if (b) { e.preventDefault(); submit(b); }
      }
    });
    update();
  }

  function render(target, spec) {
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root) return;
    if (!document.getElementById('sc-css')) {
      const s = document.createElement('style');
      s.id = 'sc-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const ctx = { qs: [], hasRec: false, q(o) { const id = `scq${this.qs.length}`; this.qs.push({ id, ...o }); return id; } };
    let html = renderBlocks(spec || {}, ctx);
    // Header: which session this is, for people juggling many.
    if (spec && (spec.title || spec.about)) {
      html = `<div class="sc-top">${spec.title ? `<div class="sc-tt">${spec.project ? `<span class="sc-proj">${esc(spec.project)}</span>` : ''}<span>${md(spec.title)}</span></div>` : ''}${spec.about ? `<div class="sc-ab">${md(spec.about)}</div>` : ''}</div>` + html;
    }
    if (ctx.qs.length) {
      const send = (spec && spec.send) || {};
      html += `<div class="sc-act"><button type="button" class="sc-pri you" data-send>${esc(send.label || 'Send answers')} ↗</button>${ctx.hasRec ? '<button type="button" data-fill>Use your picks</button>' : ''}${arr(send.buttons).map((x) => button(x)).join('')}</div><div class="sc-prev" aria-live="polite"></div>`;
    }
    root.classList.add('sc');
    // The host only gives us theme variables, so read the text colour: light text means a dark screen.
    const dark = () => {
      const m = getComputedStyle(root).color.match(/\d+(\.\d+)?/g);
      return m ? (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 > 0.5 : matchMedia('(prefers-color-scheme: dark)').matches;
    };
    root.classList.toggle('sc-dark', dark());
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => root.classList.toggle('sc-dark', dark()));
    root.innerHTML = html;
    wire(root, spec || {}, ctx);
  }

  // Plain-text version, for a fallback or a terminal.
  function text(spec) {
    const mark = { done: '🟢', you: '🟠', next: '🔵', stop: '🔴', idle: '⚪' };
    const lines = [];
    for (const b of arr(spec && spec.blocks)) {
      if (b.type === 'banner') lines.push(`${mark[st(b.state, 'you')]} ${b.title || BANNER[st(b.state, 'you')][1]}${b.sub ? `: ${b.sub}` : ''}`);
      if (b.type === 'lanes') for (const l of arr(b.lanes)) for (const it of arr(l.items)) lines.push(`${mark[st(l.state)]} ${typeof it === 'string' ? it : [it.lead, it.text].filter(Boolean).join(' ')}`);
      if (b.type === 'step') lines.push(`${mark.you} ${b.title}`);
      if (b.type === 'note') lines.push(`${mark[st(b.state, 'stop')]} ${b.text}`);
    }
    return lines.join('\n');
  }

  window.SessionCard = { render, text, version: VERSION };
})();
