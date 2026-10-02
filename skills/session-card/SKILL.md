---
name: session-card
description: End-of-turn status card. A colour-coded inline widget showing where the session stands (done, what the user must do or decide, what Claude does next, what's blocked), built from a JSON spec by a hosted renderer, with buttons and questions the user can answer from the card. Use at the end of every turn in the Claude desktop app, claude.ai or mobile (anywhere show_widget exists); never in a plain terminal.
---

# Session card

Long chat scrollback is hard to scan, especially with ADHD. At the end of a turn the user wants one glance to answer: **where are we, and what do I need to do?** This skill draws that glance as an inline widget. You write a short JSON spec of blocks; a hosted renderer draws it. Pick the blocks that fit this moment and leave the rest out.

## Always show a card

End **every** turn with a card, wherever cards can be drawn. The user can't see earlier cards once the chat moves on, so each card stands on its own:

- **Say whether you're finished.** If the turn completed something, the card says so, even for a small change.
- **Repeat what's still open.** Any question or decision from an earlier card that hasn't been answered goes on this card again, with its buttons, until it's answered.
- **Quick answers get a small card:** the header and banner, maybe one line. **Commands for the user to run** go on the card as `cmd` blocks.

A stop hook backs this up: if a turn ends without a card, it sends a "Turn check (session-card)" nudge, and you show one then (no text before it, then the `Next: "…"` line).

## Drawing it

Use the `show_widget` tool (from the `visualize` MCP server; if it's deferred, load it with ToolSearch `show_widget`). Call that server's `read_me` once per session before the first card, silently. Then send exactly this, with your spec:

```html
<h2 class="sr-only">SUMMARY</h2>
<div id="sc"></div>
<script src="https://cdn.jsdelivr.net/gh/timoconnellaus/session-card@v2.2.0/renderer.js" integrity="sha384-nO+zKHT4Hvn8sOfKPQVDv95NazwjBKWjILQ7gChN+lUYIU2DX2Ar1pSW8Hro3GIX" crossorigin="anonymous"></script>
<script>
const spec = { "project": "repo-name", "title": "TITLE", "about": "ABOUT", "summary": "SUMMARY", "blocks": [ ... ] };
window.SessionCard ? SessionCard.render('#sc', spec) : (document.getElementById('sc').textContent = spec.summary);
</script>
```

Every card starts with a header, because the user juggles many sessions and needs to know which one this is without reading back:

- `title` (required): what this session is about, as a short name ("Voice messages on the planning page"). Keep it exactly the same on every card in the session, unless the work really changes.
- `about` (required): one or two short sentences: the goal, and where it's at now.
- `project` (optional): the repo or folder name, shown as a small label.

`summary` is one sentence for screen readers and the fallback.

**The card is the last thing the user sees.** Anything you want to say goes before the `show_widget` call, kept to a few lines, because the card already carries the status. After the call returns, write exactly one short line and nothing else: the reply the user is most likely to send next, in their words, as `Next: "…"` (for example `Next: "Tried it on the phone, it works. Ship it."`). It matches the card's primary button. Claude Code's Tab suggestion is generated from the conversation, so ending on that line steers it, and the user can press Tab then Enter instead of reaching for the card. When nothing is waiting on them, use the natural follow-up (`Next: "Carry on."` or `Next: "What's left?"`). Never a recap, a "let me know", or a repeat of the card: text after the card pushes it out of view.

**Only where cards can be drawn.** Cards are for the Claude desktop app, claude.ai and mobile, where `show_widget` exists. In a plain terminal session (no `show_widget` tool, even after a ToolSearch), don't show a card and don't write a text version: just end the turn as you normally would.

## States

Sort every open thread into a **state**, which sets its colour everywhere:

| state | colour | word | means |
|---|---|---|---|
| `you` | violet | Your turn | needs the user: try it, decide, approve, say go, provide something |
| `stop` | rose | Blocked | blocked on something outside the user's control, or seen failing |
| `next` | cyan | Claude's on it | something is genuinely running without the user (a deploy, CI, a background agent) |
| `done` | green | All done (or Answered) | finished and verified this session, with nothing open |
| `idle` | grey | Paused | not started, unknown, stale, later |

**The turn ends when you stop.** Once your reply ends, you aren't working, so never say "Claude's on it" (or "I'm fixing it", "I'll report back") unless a named background process really is running. If your next step needs the user to say go, that's `you`: put your plan in the `next` lane and a primary "Go ahead" button.

**The banner words are fixed.** The renderer always shows the state's word and colour, and works the state out from the card: anything waiting on the user makes it `you`, and green never shows while anything is open. A `title` is kept as a quieter suffix ("Your turn · review"), so use it only for a few words of flavour. "Answered" is the one alternative word, for a done quick answer.

**The right-hand load always answers "what's on me?".** Leave `sub` out and the renderer fills it in from the card: "2 things · about 7 min", "3 things · about 20+ min" when an item has no estimate, or "Nothing needs you". Only set `sub` when a background process needs a time ("Nothing needs you · back in about 3 min").

**Voice:** third person for Claude ("Then Claude: fix the type error"), never "I". The user's items are imperatives ("Try it on the phone").

## Honesty rules

- Green needs evidence from this session: a check counts only if it ran after the last edit in its scope and you read its output. Older runs are `idle` "Stale".
- Not run is a state, never an omission. If the app changed and nothing ran on a device, say so in grey.
- Red only for an observed failure. Unknown is grey.
- Don't let one step stand for the next: builds isn't tests pass; tests pass isn't works; deployed isn't installed; a PR marked merged isn't deployed.
- Counts come verbatim from output. Never "all" or rounded; say if a run was filtered.
- No block without a source: no PR means no `pr` block; no CI means no checks row for CI; label git ahead/behind with when you fetched.
- "All done" needs a clean slate: no uncommitted changes, nothing behind, and no red or grey rows in scope.
- Proof grades: **observed** means you saw it run, including clicking through it yourself; **tested** means an automated test ran (give the count); **inferred** means you read the code; **unchecked** means nobody looked. When anything is unchecked or not run, the primary button names that gap ("Looks good, release it (Safari unchecked)").
- Gather git facts cheaply in one read-only batch: `git status --porcelain=v2 --branch`, `git rev-list --left-right --count origin/main...HEAD`, `git merge-base --is-ancestor HEAD origin/main` (the only proof of merged), `git diff --numstat origin/main...HEAD`, and `gh pr view --json number,title,state,isDraft,mergeable,reviewDecision,statusCheckRollup` if a PR exists. Tests and deploys come only from output already in the session; don't run suites just to fill the card.

## Load rules

- One hot thing per card. At most 3 items show in a lane (the renderer folds the rest), at most 3 buttons, and the first button is the recommended move (`primary: true`).
- **Say things once.** Don't pair `tiles` with a load that gives the same count. In `back`, leave out `now` when a question follows. Don't put "safe to stop" next to an unanswered question.
- Drop empty lanes. Leave out file names and meta unless they help a decision.
- Items: start with a verb, name the concrete thing, say where it happens ("on the phone"). No "consider", "maybe", "please". Digits, not number words. ≤ about 8 words; a bold `lead` is fine. Keep an item's wording the same from card to card. `next` items are joined with "; then", so write each as a plain step.
- **One name per thing:** an item's text, its `q` label and the words in the sent message match.
- `cost` is the user's time ("1 min", "5 min", "15 min", "30+ min"), `effort` 1–3 (1 a tap or glance, 2 focus at a desk, 3 deep thinking or another person). Leave them off when unsure.
- Text fields accept `**bold**` and `` `code` ``.

## Blocks

Every block is `{"type": ..., ...}`. Items in lists are a string or `{"text", "lead", "cost", "effort", "meta"}`.

**Status**
- `banner` `{state, title?, sub?}`: whose turn. It joins the header line (coloured dot, state word, session title, project, load). See States.
- `back` `{ago, doing, last, now?}`: where you left off, on the first card after a break.
- `lanes` `{lanes: [{state, items, title?, foldSummary?}]}`: the heart of most cards. `you` and `stop` items are arrow lines (3 at most, the rest folded). `done` becomes one line ("✓ 5 done · first few…") that opens to the full list. `next` ("↳ Then Claude: …") and `idle` are one line each.
- `step` `{title, checks?: [text], cost?, effort?, label?}`: one big next action with a local checklist.
- `track` `{stages: [{label, state}]}`: a vertical stepper, 3–6 stages.
- `tiles` `{tiles: [{state, label, value}]}`: counts. `rows` `{rows: [{state, text, tag?, cost?, buttons?}]}`: one tagged list, yours first.
- `win` `{text, meta?}`: progress since the last card. Facts only, no praise.
- `exit` `{state, text, sub?}`: `idle` "**Safe to stop here.**" with how to pick up; `next` for real background work; `stop` for "don't walk away yet".
- `note` `{state, text}`, `skip` `{text}` (safe to ignore, at most 2 things), `later` `{text | items}`, `fold` `{summary, items}`, `chips`, `meta`, `cmd` `{cmd}` (a command the user runs, with Copy).

**Dev workflow**
- `git` `{branch, worktree?, ahead?, behind?, base?, dirty?, merged?, asOf?}`: neutral grey facts; only uncommitted changes and "behind" are coloured.
- `pr`, `checks` `{title?, rows: [{state, name, scope?, evidence?}]}`, `proof` `{rows: [{grade, text, how?}]}`, `env`, `diff`, `risk` `{items, rollback?, irreversible?}`.

**Answering from the card.** Every question on a card is collected into one message by a violet **Put in my reply** button the renderer adds. It puts the answers into the user's message box; they press Enter to send. A folded "Message preview" shows the exact text, and **Reset to defaults** puts the card back as you drew it.
- `decide` `{q, title, options: [{label, value?, why?, rec?}], other?}`: one real fork, 2–4 options. Mark your pick with `rec` and say if it's easy to undo.
- `ask` `{questions: [{q, text, rec?}], choices?}`: small yes/no/later questions; `rec` pre-selects.
- `reply` `{q, title, placeholder?, required?, min?}`: free text. Set `required` when the text is the point of the card.
- `approve` `{q, title, text?, preselect?}`: approve, approve with a tweak, or no. Nothing is selected unless `preselect: true`; only pre-select approvals that are easy to undo.
- `rank` `{q, title?, items}`: reorder or drop next steps.
- `park` `{items: [{q, text}], parkAll?}`: now, park or drop each open thread.
- `step` with `report: true, q`: a device-test checklist. Each check starts unset with Works / Broken / Didn't try, so nothing is reported that the user didn't mark.
- `actions` `{buttons: [{label, send, primary?}]}`: one-tap replies. `{label, copy}` copies instead.

**Safe defaults.** Never pre-fill a result the user must observe (test results, bug reports). Any go or stop instruction is visible on the card: `send.go` shows as "Ends with …", and `send.alt` turns it into a choice ("Go ahead." / "Plan only, don't start yet.").

`q` names the real thing ("UI prefix on planning page"), never "Q2". Set `spec.send = {intro, go, alt?, label?}`; `intro` names the topic. Taken recommendations are marked "(as you suggested)" and unanswered questions "skipped". Button `send` text is in the user's voice and makes sense without the card. Never ask for secrets on a card: show a `cmd` they run themselves plus a "Done, it's set" button.

## Shapes that work

- **Your turn:** banner → lanes (you, done, next) → note → actions
- **Waiting on go:** banner → lanes (done, next) → actions ("Go ahead" primary)
- **Blocked on the user:** banner → lanes (stop item) → cmd → "Done, it's set"
- **Back from a break:** back → decide or step → exit (below the buttons)
- **Ship check:** banner → git → checks(Ship gate) → env → actions
- **Ready for review:** banner → diff → proof → actions
- **Questions:** decide / ask / approve (the reply button is added)
- **All done:** banner(done) → lanes(done) → later

## Example

```json
{
  "project": "tims-home",
  "title": "Voice messages on the planning page",
  "about": "Hold-to-talk on the planning page, sent as answers. Built and tested; waiting on a phone check.",
  "summary": "Your turn: try the mic on the phone, then say go",
  "blocks": [
    {"type": "banner", "state": "you"},
    {"type": "lanes", "lanes": [
      {"state": "you", "items": [{"lead": "Try it on the phone.", "text": "Slide left to cancel.", "cost": "2 min", "effort": 1}]},
      {"state": "done", "items": ["Mic on the planning page", "Transcription wired up", "14 unit tests pass"]},
      {"state": "next", "items": ["Publish the APK once you say go"]}
    ]},
    {"type": "note", "state": "stop", "text": "**Heads up:** no ElevenLabs key, so replies stay text-only."},
    {"type": "actions", "buttons": [{"label": "Tested it, ship it", "send": "Tested the mic on the phone, it works. Ship it.", "primary": true}]}
  ]
}
```
