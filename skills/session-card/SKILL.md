---
name: session-card
description: Status card for when Claude has finished and the user is up next. A colour-coded, information-only inline widget (no buttons or inputs) showing what's done, what the user needs to do or decide (questions as numbered options to answer in chat), and what's blocked. Use at the end of a turn where Claude is done and waiting on the user, in the Claude desktop app, claude.ai or mobile (anywhere show_widget exists). Never while background work is still running, and never in a plain terminal.
---

# Session card

Long chat scrollback is hard to scan, especially with ADHD. At the end of a turn the user wants one glance to answer: **where are we, and what do I need to do?** This skill draws that glance as an inline widget. You write a short JSON spec of blocks; a hosted renderer draws it. Pick the blocks that fit this moment and leave the rest out.

## When to show a card

Show a card when **you have finished and the user is up next**. The point is that when they look over, they can see straight away what the next thing to do is. Every card has to be signal, so:

- **Not while background work is still running.** If you're stopping only to wait for background agents, workflows or a backgrounded command, there's no card; end the turn plainly. The card comes when the work is in and you're waiting on them.
- **When you've finished,** even after a small change or a quick answer, show it. The user can't see earlier cards once the chat moves on, so each card says whether the work is finished and repeats any question still waiting on them.
- **Commands for the user to run** go on the card as `cmd` blocks.

A stop hook backs this up: when a turn ends with you waiting on the user and no card (and no background work running), it sends a "Turn check (session-card)" nudge, and you show one then (no text before it, then the `Next: "…"` line).

**Information only.** The card has no buttons, inputs or copy buttons. It tells the user where things stand; they answer in chat. Questions are shown as numbered items with lettered options and your recommendation marked, so a reply like "1a, 2 yes" is enough.

## Drawing it

Use the `show_widget` tool (from the `visualize` MCP server; if it's deferred, load it with ToolSearch `show_widget`). Call that server's `read_me` once per session before the first card, silently. Then send exactly this, with your spec:

```html
<h2 class="sr-only">SUMMARY</h2>
<div id="sc"></div>
<script src="https://cdn.jsdelivr.net/gh/timoconnellaus/session-card@v3.0.0/renderer.js" integrity="sha384-ROqPqDcWL1ixnPQXQ9nfRd0Sx1NLUQr+bQ89k1DNBSb4YZFxBu2SiEsjLZimgWDg" crossorigin="anonymous"></script>
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

**The card is the last thing the user sees.** Anything you want to say goes before the `show_widget` call, kept to a few lines, because the card already carries the status. After the call returns, write exactly one short line and nothing else: the reply the user is most likely to send next, in their words, as `Next: "…"` (for example `Next: "Tried it on the phone, it works. Ship it."`). Claude Code's Tab suggestion is generated from the conversation, so ending on that line steers it, and the user can press Tab then Enter. When nothing is waiting on them, use the natural follow-up (`Next: "Carry on."` or `Next: "What's left?"`). Never a recap, a "let me know", or a repeat of the card: text after the card pushes it out of view.

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

**The turn ends when you stop.** Once your reply ends, you aren't working, so never say "Claude's on it" (or "I'm fixing it", "I'll report back") unless a named background process really is running. If your next step needs the user to say go, that's `you`: put your plan in the `next` lane, and the load reads "say go".

**The banner words are fixed.** The renderer always shows the state's word and colour, and works the state out from the card: anything waiting on the user makes it `you`, and green never shows while anything is open. A `title` is kept as a quieter suffix ("Your turn · review"), so use it only for a few words of flavour. "Answered" is the one alternative word, for a done quick answer.

**The right-hand load always answers "what's on me?".** Leave `sub` out and the renderer fills it in from the card: "2 things · about 7 min", "3 things · about 20+ min" when an item has no estimate, or "Nothing needs you". With nothing on the user and only your plan in the `next` lane, set `sub` to "Say go".

**Voice:** third person for Claude ("Then Claude: fix the type error"), never "I". The user's items are imperatives ("Try it on the phone").

## Honesty rules

- Green needs evidence from this session: a check counts only if it ran after the last edit in its scope and you read its output. Older runs are `idle` "Stale".
- Not run is a state, never an omission. If the app changed and nothing ran on a device, say so in grey.
- Red only for an observed failure. Unknown is grey.
- Don't let one step stand for the next: builds isn't tests pass; tests pass isn't works; deployed isn't installed; a PR marked merged isn't deployed.
- Counts come verbatim from output. Never "all" or rounded; say if a run was filtered.
- No block without a source: no PR means no `pr` block; no CI means no checks row for CI; label git ahead/behind with when you fetched.
- "All done" needs a clean slate: no uncommitted changes, nothing behind, and no red or grey rows in scope.
- Proof grades: **observed** means you saw it run, including clicking through it yourself; **tested** means an automated test ran (give the count); **inferred** means you read the code; **unchecked** means nobody looked. When anything is unchecked or not run, say so in the card (and in the `Next` line).
- Gather git facts cheaply in one read-only batch: `git status --porcelain=v2 --branch`, `git rev-list --left-right --count origin/main...HEAD`, `git merge-base --is-ancestor HEAD origin/main` (the only proof of merged), `git diff --numstat origin/main...HEAD`, and `gh pr view --json number,title,state,isDraft,mergeable,reviewDecision,statusCheckRollup` if a PR exists. Tests and deploys come only from output already in the session; don't run suites just to fill the card.

## Load rules

- One hot thing per card. At most 3 items show in a lane (the renderer folds the rest).
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
- `tiles` `{tiles: [{state, label, value}]}`: counts. `rows` `{rows: [{state, text, tag?, cost?}]}`: one tagged list, yours first.
- `win` `{text, meta?}`: progress since the last card. Facts only, no praise.
- `exit` `{state, text, sub?}`: `idle` "**Safe to stop here.**" with how to pick up; `next` for real background work; `stop` for "don't walk away yet".
- `note` `{state, text}`, `skip` `{text}` (safe to ignore, at most 2 things), `later` `{text | items}`, `fold` `{summary, items}`, `chips`, `meta`, `cmd` `{cmd}` (a command the user runs, with Copy).

**Dev workflow**
- `git` `{branch, worktree?, ahead?, behind?, base?, dirty?, merged?, asOf?}`: neutral grey facts; only uncommitted changes and "behind" are coloured.
- `pr`, `checks` `{title?, rows: [{state, name, scope?, evidence?}]}`, `proof` `{rows: [{grade, text, how?}]}`, `env`, `diff`, `risk` `{items, rollback?, irreversible?}`.

**Questions** (read-only; numbered across the card so the user can answer "1a, 2 yes" in chat)
- `decide` `{title, options: [{label, why?, rec?}], other?}`: one real fork, 2–4 lettered options. Mark your pick with `rec` and say if it's easy to undo.
- `ask` `{questions: [{text, rec?}], choices?}`: small yes/no/later questions; `rec` is shown as "suggested".
- `reply` `{title, placeholder?}`: something only words can answer; `placeholder` becomes an example.
- `approve` `{title, text?}`: approve, approve with a change, or no.
- `rank` `{title?, items}`: a numbered list to reorder.
- `park` `{items: [{text}]}`: open threads to keep, park or drop.
- `step` with `report: true`: a device test; the user replies with what worked.

There are no buttons: `actions` blocks are ignored. Never ask for secrets: show a `cmd` the user runs themselves. Never pre-fill a result the user must observe.

## Shapes that work

- **Your turn:** banner → lanes (you, done, next) → note
- **Waiting on go:** banner (sub "Say go") → lanes (done, next)
- **Blocked on the user:** banner → lanes (stop item) → cmd
- **Back from a break:** banner → back → decide or step
- **Ship check:** banner → git → checks(Ship gate) → env
- **Ready for review:** banner → diff → proof
- **Questions:** banner → decide / ask / approve
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
    {"type": "note", "state": "stop", "text": "**Heads up:** no ElevenLabs key, so replies stay text-only."}
  ]
}
```
