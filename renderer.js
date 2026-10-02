/* session-card renderer: turns a JSON spec into an end-of-turn status card.
   Runs inside a Claude chat widget. Uses the host's theme CSS variables,
   Tabler outline icons (`ti ti-*`). It only informs: no buttons or inputs; the user answers in chat. */
(function () {
  const VERSION = '3.0.0';

  const CSS = `
.sc{display:flex;flex-direction:column;gap:10px;box-sizing:border-box;background:var(--surface-2);border:0.5px solid var(--border);border-radius:6px;padding:12px 14px;font-size:13px;line-height:1.4;color:var(--text-primary);--sc-you:#7C3AED;--sc-you-b:#F3E8FF;--sc-you-l:#C084FC;--sc-done:#15803D;--sc-done-b:#DCFCE7;--sc-done-l:#4ADE80;--sc-next:#0E7490;--sc-next-b:#CFFAFE;--sc-next-l:#22D3EE;--sc-stop:#BE123C;--sc-stop-b:#FFE4E6;--sc-stop-l:#FB7185}
.sc.sc-dark{--sc-you:#C084FC;--sc-you-b:rgba(192,132,252,.13);--sc-you-l:rgba(192,132,252,.55);--sc-done:#4ADE80;--sc-done-b:rgba(74,222,128,.12);--sc-done-l:rgba(74,222,128,.5);--sc-next:#22D3EE;--sc-next-b:rgba(34,211,238,.12);--sc-next-l:rgba(34,211,238,.5);--sc-stop:#FB7185;--sc-stop-b:rgba(251,113,133,.13);--sc-stop-l:rgba(251,113,133,.55)}
.sc .done{--c:var(--sc-done);--b:var(--sc-done-b);--l:var(--sc-done-l)}.sc .you{--c:var(--sc-you);--b:var(--sc-you-b);--l:var(--sc-you-l)}.sc .next{--c:var(--sc-next);--b:var(--sc-next-b);--l:var(--sc-next-l)}.sc .stop{--c:var(--sc-stop);--b:var(--sc-stop-b);--l:var(--sc-stop-l)}.sc .idle{--c:var(--text-secondary);--b:color-mix(in srgb,var(--text-primary) 9%,transparent);--l:var(--border-strong)}
.sc b{font-weight:500}.sc code{font-family:var(--font-mono);font-size:.92em}
.sc button{font:inherit;font-size:12px;line-height:1.3;cursor:pointer;padding:3px 9px;border-radius:5px;border:0.5px solid var(--border-strong);background:transparent;color:var(--text-primary)}
.sc-hd{display:flex;align-items:baseline;gap:4px 8px;flex-wrap:wrap}.sc-dot{width:8px;height:8px;border-radius:50%;background:var(--c);align-self:center;flex-shrink:0}.sc-st{font-size:14px;font-weight:600;color:var(--c)}.sc-tt{font-size:14px;font-weight:500}.sc-proj{font-size:11px;font-family:var(--font-mono);color:var(--text-muted)}.sc-hm{margin-left:auto;font-size:11px;color:var(--text-muted)}
.sc-ab{font-size:12px;color:var(--text-secondary);margin-top:-7px;padding-left:16px}
.sc-body{display:flex;flex-direction:column;gap:10px;padding-left:16px}
.sc-lines{display:flex;flex-direction:column;gap:3px}.sc-ln{display:flex;gap:6px}.sc-ar{color:var(--c);flex-shrink:0}.sc-ln .sc-tx2{color:var(--text-secondary)}
.sc-sums{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text-muted)}.sc-k{color:var(--c)}
.sc-fold summary,.sc-sums summary{list-style:none;cursor:pointer}.sc-fold summary::-webkit-details-marker,.sc-sums summary::-webkit-details-marker{display:none}
.sc-sh::after{content:"show";margin-left:6px;color:var(--text-muted);text-decoration:underline dotted;text-underline-offset:2px}details[open]>summary .sc-sh::after{content:"hide"}
.sc-sums ul,.sc-fold ul{margin:3px 0 2px;padding-left:16px;color:var(--text-secondary)}
.sc-fold{font-size:12px;color:var(--text-muted)}
.sc-cost{font-size:11px;font-family:var(--font-mono);color:var(--text-muted);margin-left:8px;white-space:nowrap}.sc-cost i.ti{margin-right:2px}.sc-e{display:inline-flex;gap:2px;margin-left:5px;vertical-align:middle}.sc-e s{width:5px;height:5px;border-radius:50%;background:var(--text-muted);opacity:.35}.sc-e s.on{background:var(--text-secondary);opacity:1}
.sc-pill{display:inline-block;font-size:11px;font-weight:500;background:var(--b);color:var(--c);border:0.5px solid var(--l);border-radius:4px;padding:1px 7px;margin-right:4px}.sc-meta{font-size:11px;color:var(--text-muted)}
.sc-box{border:0.5px solid var(--border);border-radius:5px;padding:8px 10px}.sc-hot{border-color:var(--l)}
.sc-h{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--c);margin-bottom:4px}.sc-n{margin-left:auto;font-size:11px;font-family:var(--font-mono);color:var(--c)}
.sc-li{display:flex;gap:6px;color:var(--text-secondary);margin-top:3px}.sc-h+.sc-li,.sc-li:first-child{margin-top:0}.sc-li>em{font-style:normal;font-family:var(--font-mono);color:var(--c)}.sc-li b{color:var(--text-primary)}
.sc-step{border:0.5px solid var(--l);border-radius:6px;padding:10px 12px}.sc-big{font-size:16px;font-weight:500;line-height:1.3;margin:6px 0 6px}.sc-ck{display:flex;align-items:center;gap:8px;color:var(--text-secondary);margin-top:4px}.sc-ck input{width:15px;height:15px;flex-shrink:0;accent-color:var(--sc-you)}
.sc-trk{display:flex;flex-direction:column}.sc-trk>div{position:relative;display:flex;align-items:center;gap:10px;min-height:28px;font-size:12px;color:var(--c)}.sc-trk>div::before{content:"";position:absolute;left:8px;bottom:calc(50% + 11px);width:2px;height:6px;border-radius:1px;background:var(--l)}.sc-trk>div:first-child::before{display:none}.sc-trk i.sc-dot2{flex-shrink:0;width:18px;height:18px;border-radius:50%;background:var(--c);color:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:11px;font-style:normal;box-sizing:border-box}.sc-trk .idle i.sc-dot2{background:transparent;border:1.5px solid var(--border-strong)}.sc-trk .you i.sc-dot2{box-shadow:0 0 0 3px var(--b)}.sc-trk .you{font-weight:500}
.sc-tiles{display:flex;flex-wrap:wrap;gap:6px}.sc-tile{display:inline-flex;align-items:baseline;gap:5px;background:var(--b);color:var(--c);border:0.5px solid var(--l);border-radius:4px;padding:1px 7px;font-size:11px}.sc-tile strong{order:-1;font-family:var(--font-mono);font-weight:500}
.sc-rows{border:0.5px solid var(--border);border-radius:5px;overflow:hidden}.sc-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:6px 10px;border-top:0.5px solid var(--border)}.sc-row:first-child{border-top:0}.sc-row.sc-on{background:var(--b)}.sc-row>.sc-tx{flex:1;min-width:150px}.sc-tag{flex-shrink:0;min-width:48px;box-sizing:border-box;text-align:center;font-size:11px;font-weight:500;border-radius:4px;padding:1px 7px;background:var(--b);color:var(--c);border:0.5px solid var(--l)}.sc-on .sc-tag{background:transparent}
.sc-note{display:flex;align-items:baseline;gap:6px;font-size:12px;color:var(--c)}.sc-note b{color:var(--c)}
.sc-later{font-size:12px;color:var(--text-muted)}.sc-later>div:first-child{font-weight:500;color:var(--text-secondary)}
.sc-cmd{display:flex;align-items:center;gap:6px;background:var(--surface-1);border-radius:5px;padding:3px 3px 3px 8px;font-family:var(--font-mono);font-size:12px}.sc-cmd code{flex:1;overflow-x:auto;white-space:nowrap}
.sc-act,.sc-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.sc-act .sc-pri,.sc-act .sc-go{border-color:var(--l);background:var(--b);color:var(--c);font-weight:500}.sc .sc-link{border:0;background:transparent;color:var(--text-muted);text-decoration:underline dotted;text-underline-offset:2px;padding:3px 4px}.sc-goline{font-size:12px;color:var(--text-secondary)}.sc-pv{font-size:12px;color:var(--text-muted)}.sc-pv summary{list-style:none;cursor:pointer}.sc-pv summary::-webkit-details-marker{display:none}.sc-pv .sc-prev{margin-top:4px}.sc-st2{font-size:14px;color:var(--c);font-weight:400}.sc-ckr{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:5px;color:var(--text-secondary)}.sc-ckr>span:first-child{flex:1;min-width:160px}
.sc-back{font-size:12px}.sc-bl{display:flex;gap:8px;color:var(--text-secondary);margin-top:2px}.sc-bl>span{width:38px;flex-shrink:0;color:var(--text-muted)}.sc-bl.you>span,.sc-bl.you b{color:var(--c)}
.sc-win{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--c)}.sc-win .sc-meta{margin-left:auto}
.sc-exit{display:flex;gap:8px;align-items:baseline;font-size:12px;color:var(--text-secondary)}.sc-exit>i{color:var(--c)}.sc-exit b{color:var(--text-primary)}
.sc-skip{display:flex;gap:6px;align-items:baseline;font-size:12px;color:var(--text-muted)}.sc-skip b{color:var(--text-secondary)}
.sc-kk{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:1px 7px;border-radius:4px;border:0.5px solid var(--l);background:var(--b);color:var(--c)}
.sc-pr-h{display:flex;align-items:center;gap:6px;color:var(--c)}.sc-pr-h b{color:var(--text-primary);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-pr-m{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px;font-size:12px}.sc-pr-m span{display:inline-flex;align-items:center;gap:4px;color:var(--c)}
.sc-ver>div{display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;padding:5px 10px;font-size:12px;color:var(--text-secondary);border-top:0.5px solid var(--border)}.sc-ver>div:first-child{border-top:0}.sc-ver i{color:var(--c);font-size:14px}.sc-ver span{flex:1;min-width:0}.sc-ver b{color:var(--text-primary);margin-right:4px}.sc-ver code{font-size:11px;color:var(--c)}
.sc-proof{display:flex;flex-direction:column;gap:5px;font-size:12px}.sc-proof>div{display:grid;grid-template-columns:70px minmax(0,1fr);column-gap:8px}.sc-proof .sc-meta{grid-column:2}.sc-proof .sc-tag{width:auto;align-self:start}
.sc-env{display:flex;flex-direction:column;gap:3px}.sc-env>div{display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;font-size:11px;color:var(--text-secondary)}.sc-env>div::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c);flex-shrink:0}.sc-env b{font-size:13px;color:var(--text-primary)}.sc-env code{color:var(--text-primary)}.sc-env em{font-style:normal;color:var(--c);margin-left:auto}
.sc-diff{display:flex;flex-direction:column;gap:3px;font-size:12px}.sc-diff>div{display:grid;grid-template-columns:minmax(0,1fr) auto 50px;gap:8px;align-items:center}.sc-diff code{color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-pm{font-family:var(--font-mono);font-size:11px}.sc-pm ins{text-decoration:none;color:var(--sc-done);margin-right:5px}.sc-pm del{text-decoration:none;color:var(--sc-stop)}.sc-db{display:flex;height:4px;border-radius:2px;overflow:hidden;background:var(--surface-1)}.sc-db i{background:var(--sc-done)}.sc-db s{background:var(--sc-stop)}
.sc-qt{display:flex;align-items:baseline;gap:8px;font-size:14px;font-weight:500;margin-bottom:6px}.sc-q{border:0.5px solid var(--l);border-radius:5px;padding:8px 10px}.sc-qn{flex-shrink:0;min-width:18px;height:18px;border-radius:4px;background:var(--b);color:var(--c);font-size:11px;font-family:var(--font-mono);display:inline-flex;align-items:center;justify-content:center}.sc-op{display:flex;gap:8px;padding:4px 0 4px 2px;color:var(--text-secondary)}.sc-op b{color:var(--text-primary)}.sc-ol{flex-shrink:0;width:16px;font-family:var(--font-mono);color:var(--c)}.sc-ow{display:block;font-size:12px;color:var(--text-muted)}.sc-ow2{font-size:12px;color:var(--text-muted)}.sc-ql{display:flex;gap:8px;padding:3px 0}.sc-hint{font-size:12px;color:var(--text-muted);margin-top:6px}.sc-box2{width:12px;height:12px;border:1px solid var(--border-strong);border-radius:3px;flex-shrink:0}
.sc-opt{display:flex;gap:8px;align-items:flex-start;padding:6px 10px;margin-top:4px;border:0.5px solid var(--border);border-radius:5px;color:var(--text-secondary);cursor:pointer}.sc-opt input{margin-top:2px;accent-color:var(--sc-you)}.sc-opt b{color:var(--text-primary)}.sc-opt:has(input:checked){border-color:var(--l);background:var(--b)}
.sc-seg{display:inline-flex;flex-shrink:0;border:0.5px solid var(--border-strong);border-radius:5px;overflow:hidden}.sc-seg label{padding:3px 9px;font-size:12px;cursor:pointer;color:var(--text-secondary)}.sc-seg label+label{border-left:0.5px solid var(--border-strong)}.sc-seg input{position:absolute;opacity:0;pointer-events:none}.sc-seg label:has(input:checked){background:var(--b);color:var(--c);box-shadow:inset 0 0 0 1px var(--l);font-weight:500}.sc-seg label:has(input:focus-visible){outline:2px solid var(--l)}
.sc-in{display:block;width:100%;box-sizing:border-box;margin-top:6px;font:inherit;font-size:13px;padding:5px 8px;border-radius:5px;border:0.5px solid var(--border-strong);background:var(--surface-1);color:var(--text-primary);resize:vertical}.sc-in[aria-invalid=true]{border-color:var(--border-danger)}
.sc-err{font-size:12px;color:var(--text-danger);margin-top:4px}.sc-err:empty{display:none}
.sc-prev{font-family:var(--font-mono);font-size:11px;color:var(--text-muted);white-space:pre-wrap;padding:6px 8px;background:var(--surface-1);border-radius:5px}
.sc-rk{display:flex;align-items:center;gap:4px;padding:2px 0;border-top:0.5px solid var(--border)}.sc-rk:first-of-type{border-top:0}.sc-rk>em{width:18px;font-style:normal;font-family:var(--font-mono);color:var(--c)}.sc-rk>span{flex:1}.sc-rk button{width:26px;height:26px;padding:0;border:0;color:var(--text-muted)}.sc-rk button:hover{color:var(--text-primary)}.sc-rk.off>span{color:var(--text-muted);text-decoration:line-through}
@media (max-width:520px){
.sc{padding:10px 12px}.sc-hm{margin-left:0;flex-basis:100%}.sc-body,.sc-ab{padding-left:0}
.sc-proof>div{grid-template-columns:64px minmax(0,1fr)}.sc-diff>div{grid-template-columns:minmax(0,1fr) auto}.sc-db{display:none}.sc-env em{margin-left:0}
.sc button{min-height:34px}.sc-rk button{width:34px;height:34px}.sc-seg label{padding:7px 10px}.sc-row>.sc-tx{min-width:0;flex:1}.sc-row>button,.sc-row>.sc-seg{flex-basis:100%}.sc-row>.sc-seg{display:flex}.sc-row>.sc-seg label{flex:1;text-align:center}
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
    const dots = e ? `<i class="sc-e" title="effort ${e} of 3" aria-label="effort ${e} of 3">${[1, 2, 3].map((n) => `<s${n <= e ? ' class="on"' : ''}></s>`).join('')}</i>` : '';
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
    return shown + `<details class="sc-fold"><summary>${esc(summary || `${rest.length} more`)}<span class="sc-sh"></span></summary>${rest.map((it, i) => item(it, numbered ? max + i + 1 : undefined)).join('')}</details>`;
  }

  // Cards only inform: buttons and inputs are gone, the user answers in chat.
  const button = () => '';

  // The banner's colour follows the rules, whatever state was asked for: anything waiting on the
  // user makes it their turn, and "done" never shows while something is still open.
  const YOU_BLOCKS = ['decide', 'ask', 'reply', 'approve', 'rank', 'park', 'step', 'cmd'];
  function derive(blocks, given) {
    let you = false, stop = false, next = false, open = false;
    for (const b of blocks) {
      if (!b) continue;
      if (YOU_BLOCKS.includes(b.type)) you = true;
      if (b.type === 'lanes') for (const l of arr(b.lanes)) {
        if (!arr(l.items).length) continue;
        if (l.state === 'you') you = true; else if (l.state === 'stop') stop = true; else if (l.state === 'next') next = true; else if (l.state === 'idle') open = true;
      }
      if (b.type === 'rows') for (const r of arr(b.rows)) { if (r.state === 'you') you = true; if (r.state === 'stop') stop = true; if (r.state === 'next') next = true; }
    }
    if (you) return 'you';
    if (given === 'done' && (stop || next || open)) return stop ? 'stop' : 'next';
    return given;
  }
  // One word per state; a custom title is kept, but after the state word and quieter.
  const WORDS = { you: ['Your turn'], stop: ['Blocked'], next: ["Claude's on it"], done: ['All done', 'Answered'], idle: ['Paused'] };
  function stateWord(s, title) {
    if (title && WORDS[s].includes(title)) return `<span class="sc-st">${esc(title)}</span>`;
    return `<span class="sc-st">${WORDS[s][0]}</span>${title ? `<span class="sc-st2">· ${md(title)}</span>` : ''}`;
  }
  // The right-hand load always answers "what's on me?".
  function load(blocks) {
    let n = 0, mins = 0, unknown = false;
    const add = (it) => { n += 1; const m = parseInt(it && it.cost, 10); if (m) mins += m; else unknown = true; };
    for (const b of blocks) {
      if (!b) continue;
      if (b.type === 'lanes') for (const l of arr(b.lanes)) if (l.state === 'you') arr(l.items).forEach((it) => add(typeof it === 'string' ? {} : it));
      if (b.type === 'rows') arr(b.rows).filter((r) => r.state === 'you').forEach(add);
      if (b.type === 'ask' || b.type === 'park') arr(b.questions || b.items).forEach(add);
      if (['decide', 'reply', 'approve', 'rank', 'step', 'cmd'].includes(b.type)) add(b);
    }
    // A primary button with nothing else on the user means "say go": that is their one thing.
    if (!n && blocks.some((b) => b && b.type === 'actions' && arr(b.buttons).some((x) => x && x.primary))) return '1 thing · say go';
    if (!n) return 'Nothing needs you';
    return `${n} thing${n > 1 ? 's' : ''}${mins ? ` · about ${mins}${unknown ? '+' : ''} min` : ''}`;
  }

  // Questions are numbered across the card so the user can answer "1a, 2 yes" in chat.
  const qnum = (ctx, bump) => { if (bump) ctx.n = (ctx.n || 0) + 1; return bump ? String(ctx.n) : ''; };

  // Blocks render read-only; questions are numbered so the user can answer in chat.
  function renderBlocks(spec, ctx) {
    const B = {
      banner(b) {
        const s = derive(arr(spec.blocks), st(b.state, 'you'));
        return `<div class="sc-hd ${s}"><span class="sc-dot"></span>${stateWord(s, b.title)}<span class="sc-hm">${md(b.sub || load(arr(spec.blocks)))}</span></div>`;
      },
      back(b) {
        const row = (k, v, cls = '') => (v ? `<div class="sc-bl ${cls}"><span>${k}</span>${cls ? `<b>${md(v)}</b>` : md(v)}</div>` : '');
        return `<div class="sc-back idle"><div class="sc-h">${icon('history')}Where you left off${b.ago ? `<span class="sc-meta" style="margin-left:auto">${esc(b.ago)}</span>` : ''}</div>${row('Doing', b.doing)}${row('Last', b.last)}${row('Now', b.now, 'you')}</div>`;
      },
      lanes(b) {
        const txt = (it) => (typeof it === 'string' ? it : [it.lead, it.text].filter(Boolean).join(' '));
        const lines = [];
        const sums = [];
        for (const l of arr(b.lanes)) {
          const s = st(l.state);
          const list = arr(l.items);
          if (!list.length) continue;
          if (s === 'you' || s === 'stop') {
            const line = (it) => {
              if (typeof it === 'string') it = { text: it };
              return `<div class="sc-ln ${s}"><span class="sc-ar">${s === 'stop' ? '!' : '→'}</span><span>${it.lead ? `<b>${md(it.lead)}</b> ` : ''}<span class="sc-tx2">${md(it.text)}</span>${cost(it)}</span></div>`;
            };
            let h = list.slice(0, 3).map(line).join('');
            if (list.length > 3) h += `<details class="sc-fold"><summary>+${list.length - 3} more ${s === 'you' ? 'for you' : 'blocked'}<span class="sc-sh"></span></summary>${list.slice(3).map(line).join('')}</details>`;
            lines.push(`<div class="sc-lines">${h}</div>`);
          } else if (s === 'done') {
            const gist = list.slice(0, 3).map(txt).join(', ') + (list.length > 3 ? ', …' : '');
            sums.push(`<details class="done"><summary><span class="sc-k">✓ ${list.length} done</span> · ${md(l.foldSummary || gist)}<span class="sc-sh"></span></summary><ul>${list.map((it) => `<li>${md(txt(it))}</li>`).join('')}</ul></details>`);
          } else {
            const label = l.title || (s === 'next' ? 'Then Claude' : 'Waiting');
            sums.push(`<div class="${s}"><span class="sc-k">${s === 'next' ? '↳' : '·'} ${md(label)}:</span> ${md(list.map(txt).join(s === 'next' ? '; then ' : ', '))}</div>`);
          }
        }
        return lines.join('') + (sums.length ? `<div class="sc-sums">${sums.join('')}</div>` : '');
      },
      step(b) {
        const s = st(b.state, 'you');
        const checks = arr(b.checks).map((c) => `<div class="sc-ck"><span class="sc-box2" aria-hidden="true"></span>${md(c.text || c)}</div>`).join('');
        const ask = b.report ? `<div class="sc-hint">${qnum(ctx)}Reply with what worked, what broke and what you didn't try.</div>` : '';
        return `<div class="sc-step ${s}"><span class="sc-pill">${esc(b.label || 'Your one next step')}</span>${cost(b)}<div class="sc-big">${md(b.title)}</div>${checks}${ask}</div>`;
      },
      track(b) {
        return `<div class="sc-trk">${arr(b.stages).map((x) => {
          const s = st(x.state);
          const ic = s === 'done' ? icon('check') : s === 'you' ? icon('user') : s === 'next' ? icon('player-play') : s === 'stop' ? icon('x') : '';
          return `<div class="${s}"><i class="sc-dot2">${ic}</i>${md(x.label)}</div>`;
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
      cmd: (b) => `<div class="sc-cmd"><code>${esc(b.cmd)}</code></div>`,
      chips: (b) => `<div class="sc-chips">${arr(b.chips).map((c) => `<span class="sc-pill ${st(c.state)}">${md(c.text)}</span>`).join('')}</div>`,
      meta: (b) => `<div class="sc-meta">${md(b.text)}</div>`,
      win: (b) => `<div class="sc-win ${st(b.state, 'done')}">${icon('trending-up')}<span>${md(b.text)}</span>${b.meta ? `<span class="sc-meta">${md(b.meta)}</span>` : ''}</div>`,
      exit: (b) => `<div class="sc-exit ${st(b.state, 'idle')}">${icon(b.icon || (b.state === 'stop' ? 'alert-octagon' : b.state === 'next' ? 'hourglass' : 'door-exit'))}<div>${md(b.text)}${b.sub ? `<div class="sc-meta">${md(b.sub)}</div>` : ''}</div></div>`,
      skip: (b) => `<div class="sc-skip">${icon('eye-off')}<span><b>Safe to ignore:</b> ${md(b.text)}</span></div>`,
      fold: (b) => `<details class="sc-fold"><summary>${md(b.summary)}<span class="sc-sh"></span></summary>${arr(b.items).map((x) => item(x)).join('')}</details>`,
      git(b) {
        const k = (s, ic, t) => `<span class="sc-kk ${s}">${icon(ic)}${t}</span>`;
        const out = [];
        if (b.branch) out.push(k('idle', 'git-branch', `<code style="color:var(--text-primary)">${esc(b.branch)}</code>`));
        if (b.worktree) out.push(k('idle', 'folders', esc(b.worktree)));
        if (b.ahead) out.push(k('idle', 'arrow-up', `${esc(b.ahead)} ahead`));
        if (b.behind) out.push(k('you', 'arrow-down', `${esc(b.behind)} behind ${esc(b.base || 'main')}`));
        if (b.dirty) out.push(k(st(b.dirtyState, 'you'), 'pencil', `${esc(b.dirty)} uncommitted`));
        else if (b.dirty === 0) out.push(k('idle', 'check', 'Clean'));
        if (b.merged === true) out.push(k('idle', 'git-merge', 'Merged'));
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
        return `<div class="sc-box ${s}" style="border-color:var(--l)"><div class="sc-h">${icon('shield-exclamation')}${md(b.title || 'Risk and rollback')}${b.irreversible ? '<span class="sc-pill" style="margin-left:auto">Irreversible</span>' : ''}</div>${items(b.items, { max: 6 })}${b.rollback ? `<div class="sc-cmd" style="margin-top:10px"><code>${esc(b.rollback)}</code></div>` : ''}</div>`;
      },
      actions: () => '',

      decide(b) {
        const n = qnum(ctx, true);
        const opts = arr(b.options).map((o, i) => {
          if (typeof o === 'string') o = { label: o };
          const L = String.fromCharCode(97 + i);
          return `<div class="sc-op${o.rec ? ' sc-rec' : ''}"><span class="sc-ol">${L}</span><span><b>${md(o.label)}</b>${o.rec ? ' <span class="sc-pill you">Recommended</span>' : ''}${o.why ? `<span class="sc-ow">${md(o.why)}</span>` : ''}</span></div>`;
        }).join('');
        const rec = arr(b.options).findIndex((o) => o && o.rec);
        return `<div class="sc-q you"><div class="sc-qt"><span class="sc-qn">${n}</span>${md(b.title)}</div>${opts}<div class="sc-hint">Reply “${n}${rec >= 0 ? String.fromCharCode(97 + rec) : 'a'}”${b.other ? ', or say what you want instead' : ''}.</div></div>`;
      },
      ask(b) {
        return `<div class="sc-q you">${arr(b.questions).map((q) => {
          const n = qnum(ctx, true);
          return `<div class="sc-ql"><span class="sc-qn">${n}</span><span>${md(q.text)}${q.rec ? ` <span class="sc-ow2">suggested: ${esc(q.rec)}</span>` : ''}</span></div>`;
        }).join('')}<div class="sc-hint">Reply with ${arr(b.choices).length ? esc(b.choices.join(' / ').toLowerCase()) : 'yes / no / later'} for each, or just “ok” to take the suggestions.</div></div>`;
      },
      reply(b) {
        const n = qnum(ctx, true);
        return `<div class="sc-q you"><div class="sc-qt"><span class="sc-qn">${n}</span>${md(b.title)}</div>${b.placeholder ? `<div class="sc-hint">For example: ${md(b.placeholder)}</div>` : ''}</div>`;
      },
      approve(b) {
        const n = qnum(ctx, true);
        return `<div class="sc-q you"><div class="sc-qt"><span class="sc-qn">${n}</span>${md(b.title)}</div>${b.text ? `<div class="sc-li">${md(b.text)}</div>` : ''}<div class="sc-hint">Reply approve, approve with a change, or no.</div></div>`;
      },
      rank(b) {
        const n = qnum(ctx, true);
        return `<div class="sc-q you"><div class="sc-qt"><span class="sc-qn">${n}</span>${md(b.title || 'What first?')}</div>${arr(b.items).map((x, i) => `<div class="sc-ql"><span class="sc-ol">${i + 1}</span><span>${md(typeof x === 'string' ? x : x.label)}</span></div>`).join('')}<div class="sc-hint">Reply with the order you want, e.g. “2 1 3”, leaving out any to drop.</div></div>`;
      },
      park(b) {
        return `<div class="sc-q idle"><div class="sc-qt">Still open</div>${arr(b.items).map((x) => `<div class="sc-ql"><span class="sc-ar">·</span><span>${md(x.text)}</span></div>`).join('')}<div class="sc-hint">Say now, park or drop for each, or “park all”.</div></div>`;
      },
    };
    return arr(spec.blocks).map((b) => {
      const fn = B[b && b.type];
      return fn ? fn(b) : '';
    }).join('');
  }

  function render(target, spec) {
    let root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root) return;
    if (root.dataset.scWired) { // a redraw: swap in a clean element so old listeners go with the old one
      const fresh = root.cloneNode(false);
      root.replaceWith(fresh);
      root = fresh;
    }
    root.dataset.scWired = '1';
    if (!document.getElementById('sc-css')) {
      const s = document.createElement('style');
      s.id = 'sc-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const ctx = { n: 0 };
    spec = spec || {};
    // Header line: whose turn (from the first banner) and which session, for people juggling many.
    const blocks = arr(spec.blocks);
    const bi = blocks.findIndex((x) => x && x.type === 'banner');
    const ban = bi >= 0 ? blocks[bi] : null;
    let head = '';
    if (spec.title) {
      const s = ban ? derive(blocks, st(ban.state, 'you')) : 'idle';
      head = `<div class="sc-hd ${s}"><span class="sc-dot"></span>${ban ? stateWord(s, ban.title) : ''}<span class="sc-tt">${md(spec.title)}</span>${spec.project ? `<span class="sc-proj">${esc(spec.project)}</span>` : ''}${ban ? `<span class="sc-hm">${md(ban.sub || load(blocks))}</span>` : ''}</div>${spec.about ? `<div class="sc-ab">${md(spec.about)}</div>` : ''}`;
    }
    const body = renderBlocks(head && ban ? { ...spec, blocks: blocks.filter((_, i) => i !== bi) } : spec, ctx);
    const html = head ? head + (body ? `<div class="sc-body">${body}</div>` : '') : body;
    root.classList.add('sc');
    // The host only gives us theme variables, so read the text colour: light text means a dark screen.
    const dark = () => {
      const m = getComputedStyle(root).color.match(/\d+(\.\d+)?/g);
      return m ? (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 > 0.5 : matchMedia('(prefers-color-scheme: dark)').matches;
    };
    root.classList.toggle('sc-dark', dark());
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => root.classList.toggle('sc-dark', dark()));
    root.innerHTML = html;
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
