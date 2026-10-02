---
name: session-card
description: End-of-turn status card. A colour-coded inline widget showing where the session stands (done, what the user must do or decide, what Claude does next, what's blocked), built from a JSON spec by a hosted renderer, with buttons and questions the user can answer from the card. Use at the end of every turn in the Claude desktop app, claude.ai or mobile (anywhere show_widget exists); never in a plain terminal.
---

# Session card

Long chat scrollback is hard to scan, especially with ADHD. At the end of a turn the user wants one glance to answer: **where are we, and what do I need to do?** This skill draws that glance as an inline widget. You write a short JSON spec of blocks; a hosted renderer draws it. Pick the blocks that fit this moment and leave the rest out.

## Always show a card

End **every** turn with a card, wherever cards can be drawn. The user can't see earlier cards once the chat moves on, so each card stands on its own:

- **Say whether you're finished.** If the turn completed something, the card says so (a `done` banner, a `win`, or done items), even for a small change.
- **Repeat what's still open.** Any question or decision from an earlier card that hasn't been answered goes on this card again, with its buttons, until it's answered.
- **Quick answers get a small card:** the header plus a banner, maybe one line. **Commands for the user to run** go on the card as `cmd` blocks.

The description in the skill's frontmatter and a stop hook back this up: if a turn ends without a card, the hook sends a "Turn check (session-card)" nudge, and you show one then (no text before it, at most one short line after).

## Drawing it

Use the `show_widget` tool (from the `visualize` MCP server; if it's deferred, load it with ToolSearch `show_widget`). Call that server's `read_me` once per session before the first card, silently. Then send exactly this, with your spec:

```html
<h2 class="sr-only">SUMMARY</h2>
<div id="sc"></div>
<script src="https://cdn.jsdelivr.net/gh/timoconnellaus/session-card@v1.5.0/renderer.js" integrity="sha384-SsYEZaJVDwrI6XeH87xMlXkefdV0EeWM6NnRIWZ2ifoIvij3BV1riEWXzE6qoyAm" crossorigin="anonymous"></script>
<script>
const spec = { "project": "repo-name", "title": "TITLE", "about": "ABOUT", "summary": "SUMMARY", "blocks": [ ... ] };
window.SessionCard ? SessionCard.render('#sc', spec) : (document.getElementById('sc').textContent = spec.summary);
</script>
```

Every card starts with a header, because the user juggles many sessions and needs to know which one this is without reading back:

- `title` (required): what this session is about, as a short name ("Voice messages on the planning page"). Keep it exactly the same on every card in the session, unless the work really changes.
- `about` (required): one or two short sentences: the goal, and where it's at now ("Hold-to-talk on the planning page, sent as answers. Built and tested; waiting on a phone check.").
- `project` (optional): the repo or folder name, shown as a small label.

`summary` is one sentence for screen readers and the fallback.

**The card is the last thing the user sees.** Anything you want to say goes before the `show_widget` call, kept to a few lines, because the card already carries the status. After the call returns, write at most one short line (the app needs some visible text to end a turn), and never a recap, a "let me know", or a repeat of what the card shows. Text after the card pushes it out of view.

**Only where cards can be drawn.** Cards are for the Claude desktop app, claude.ai and mobile, where `show_widget` exists. In a plain terminal session (no `show_widget` tool, even after a ToolSearch), don't show a card and don't write a text version: just end the turn as you normally would.

## Sorting what happened

Sort every open thread into a **state**, which sets its colour everywhere:

| state | colour | means |
|---|---|---|
| `you` | amber | needs the user: try it, decide, approve, provide something |
| `stop` | red | blocked, or seen failing |
| `next` | blue | what Claude does next, usually once the user says go |
| `done` | green | finished and verified this session |
| `idle` | grey | not started, unknown, stale, later |

The banner's state is `you` if anything waits on the user, else `stop` if blocked, else `next` if Claude is mid-way, else `done`.

## Honesty rules

- Green needs evidence from this session: a check counts only if it ran after the last edit in its scope and you read its output. Older runs are `idle` "Stale".
- Not run is a state, never an omission. If the app changed and nothing ran on a device, say so in grey.
- Red only for an observed failure. Unknown is grey; never amber for "probably fine".
- Don't let one step stand for the next: builds isn't tests pass; tests pass isn't works; deployed isn't installed; a PR marked merged isn't deployed.
- Counts come verbatim from output. Never "all" or rounded; say if a run was filtered.
- No block without a source: no PR means no `pr` block; no CI means no checks row for CI; label git ahead/behind with when you fetched.
- "All done" needs a clean slate: no uncommitted changes, nothing behind, and no red or grey rows in scope. Otherwise downgrade the banner or move the item to `later` with the reason.
- Gather git facts cheaply in one read-only batch: `git status --porcelain=v2 --branch`, `git rev-list --left-right --count origin/main...HEAD`, `git merge-base --is-ancestor HEAD origin/main` (the only proof of merged), `git diff --numstat origin/main...HEAD`, and `gh pr view --json number,title,state,isDraft,mergeable,reviewDecision,statusCheckRollup` if a PR exists. Tests and deploys come only from output already in the session; don't run suites just to fill the card.

## Load rules

- One hot thing per card (`hot: true` on one lane, or the one question).
- At most 3 items show in a lane (the renderer folds the rest), at most 3 buttons, and the first button is the recommended move (`primary: true`).
- Drop empty lanes. Leave out file names and meta unless they help a decision.
- Items: start with a verb, name the concrete thing, say where it happens ("on the phone", "in the terminal"). No "consider", "maybe", "please". Digits, not number words. ≤ about 8 words; a bold `lead` is fine. Keep an item's wording the same from card to card.
- `cost` is the user's time in buckets ("1 min", "5 min", "15 min", "30+ min"), `effort` 1–3 (1 a tap or glance, 2 focus at a desk, 3 deep thinking or another person). Leave them off when unsure. Put the cheapest item first unless order matters.
- Text fields accept `**bold**` and `` `code` ``.

## Blocks

Every block is `{"type": ..., ...}`. Items in lists are a string or `{"text", "lead", "cost", "effort", "meta"}`.

**Status**
- `banner` `{state, title?, sub?, bar?: [states], icon?}`. Default titles: you "Your turn", done "All done", next "Claude's on it", stop "Blocked". `sub` says how much is on the user ("2 things · about 7 min"). `bar` (3+ states) is one segment per tracked item.
- `back` `{ago, doing, last, now}`: where you left off. Above the banner, only on the first card after a break.
- `lanes` `{lanes: [{state, items, hot?, title?, foldSummary?}]}`: sections stacked one under another (the whole card reads top to bottom). Default titles: done "Done", you "Your move", next "Then Claude", stop "Blocked". A `you` lane is numbered.
- `step` `{title, checks?: [text], cost?, effort?, label?}`: one big next action with a local checklist. For "if you only do one thing" and low-energy cards.
- `track` `{stages: [{label, state}]}`: a vertical stepper, 3–6 stages with "you are here".
- `tiles` `{tiles: [{state, label, value}]}`: counts.
- `rows` `{rows: [{state, text, tag?, cost?, buttons?}]}`: one tagged list, for many items. Order: you, stop, next, done.
- `win` `{text, meta?}`: progress since the last card ("**+3 done** since your last look"). Facts only, no praise.
- `exit` `{state, text, sub?}`: `idle` "**Safe to stop here.** Nothing is half-done." with how to pick up; `next` for background work ("Deploy running · back in about 3 min"); `stop` for "don't walk away yet".
- `note` `{state, text, icon?}`: a heads-up (`stop`, `you` warning, `next` info).
- `skip` `{text}`: safe to ignore (warnings, a flaky retry that passed). At most 2 things.
- `later` `{text | items, title?}`: ideas, no rush. Mostly on All done cards.
- `fold` `{summary, items}`: collapsed list; the summary says whether anything inside needs the user.
- `chips` `{chips: [{state, text}]}`, `meta` `{text}`, `cmd` `{cmd}` (a command the user runs themselves, with Copy).

**Dev workflow**
- `git` `{branch, worktree?, ahead?, behind?, base?, dirty?, dirtyState?, merged?: true|false, asOf?}`. `dirty: 0` shows "Clean".
- `pr` `{state, number, title, status, meta?: [{state, text, icon?}]}`.
- `checks` `{title?, rows: [{state, name, scope?, evidence?}]}`: tests, typecheck, build, device checks. `title: "Ship gate"` for deploy preconditions.
- `proof` `{rows: [{grade, text, how?}]}`: how we know it works. `grade`: observed (seen running), tested (a test that ran), inferred (read in code), unchecked, failed.
- `env` `{envs: [{state, name, where?, version?, status?}]}`: what's live where.
- `diff` `{files: [{path, add, del}], meta?}`: files changed; group by folder past 6.
- `risk` `{items, rollback?, irreversible?}`: live now, blast radius, a rollback command you checked is valid.

**Answering from the card** (all questions on a card are sent together as one message by a green **Send answers** button the renderer adds, with a live preview; **Reset to defaults** puts the card back as you drew it, with your recommended options selected)
- `decide` `{q, title, options: [{label, value?, why?, rec?}], other?, required?}`: one real fork, 2–4 options, mark your pick with `rec` and say if it's easy to undo.
- `ask` `{questions: [{q, text, rec?: "yes"|"no"|"later"}], choices?}`: a batch of small yes/no/later questions.
- `reply` `{q, title, placeholder?, min?}`: free text when options won't do.
- `approve` `{q, title, text?}`: approve, approve with a tweak (asks what), or no.
- `rank` `{q, title?, items}`: reorder or drop next steps; order is the instruction.
- `park` `{items: [{q, text}], parkAll?}`: now, park or drop each open thread; `parkAll` is a one-tap message.
- `step` with `report: true, q`: a device-test checklist whose ticks are reported back.
- `actions` `{buttons: [{label, send, primary?}]}`: one-tap messages. `{label, copy}` copies instead.

`q` is the question's label in the sent message, so name the real thing ("UI prefix on planning page"), never "Q2". Values carry the ids the next step needs. Set `spec.send = {intro, go, label?}`: `intro` names the topic ("Answers about the voice feature:"), `go` is a clear go or no-go ("Go ahead.", "Plan only, don't start yet."). The message marks taken recommendations "(your recommendation)" and unanswered ones "skipped". Button `send` text is in the user's voice and makes sense without the card: "Tested the mic on the phone, it works. Ship it." Never ask for secrets on a card: show a `cmd` they run themselves plus a "Done, it's set" button.

## Shapes that work

- **Your turn:** banner(you) → lanes → note → actions
- **One thing / low energy:** banner(you) → step → exit(idle) → one button
- **Back from a break:** back → step → exit
- **Progress:** banner → track → chips
- **Many items:** tiles → rows (answers inline)
- **Ship check:** banner → git → checks(Ship gate) → env → actions
- **Ready for review:** banner(you) → pr → diff → proof → actions
- **Shipped:** banner(done) → env → risk → later
- **Questions:** decide / ask / approve (Send is added)
- **All done:** banner(done) → fold → park → later

## Example

```json
{
  "project": "tims-home",
  "title": "Voice messages on the planning page",
  "about": "Hold-to-talk on the planning page, sent as answers. Built and tested; waiting on a phone check.",
  "summary": "Your turn: try the mic on the phone, then say go",
  "blocks": [
    {"type": "banner", "state": "you", "sub": "2 things · about 3 min", "bar": ["done","done","done","you","you"]},
    {"type": "lanes", "lanes": [
      {"state": "done", "items": ["Mic on the planning page", "Transcription wired up", "14 unit tests pass"]},
      {"state": "you", "hot": true, "items": [{"lead": "Try it on the phone.", "text": "Slide left to cancel.", "cost": "2 min", "effort": 1}]},
      {"state": "next", "items": ["Publish the APK once you say go"]}
    ]},
    {"type": "note", "state": "stop", "text": "**Heads up:** no ElevenLabs key, so replies stay text-only."},
    {"type": "actions", "buttons": [{"label": "Tested it, ship it", "send": "Tested the mic on the phone, it works. Ship it.", "primary": true}]}
  ]
}
```
