# session-card

End-of-turn status cards for Claude Code. When a turn leaves something for you to do, Claude draws a small colour-coded card in the chat: what's done, what you need to try or decide, what Claude will do next, and what's blocked. Built for people who find long chat scrollback hard to scan (ADHD-friendly by design).

- **Composed, not templated.** Claude picks blocks from a kit (banner, lanes, one next step, progress track, scoreboard, git and PR state, test evidence, deploys, diff, risk and rollback, and more) to fit the moment, A2UI style.
- **Answer from the card.** Decisions with a recommended option, batches of yes/no questions, approve-with-a-tweak, reordering next steps, parking open threads and device-test checklists. Everything on the card is sent back as one message.
- **Honest.** The skill's rules stop Claude marking things green without evidence from the session, and show "not run" and "stale" as states of their own.
- **Optional.** A stop hook nudges Claude once after a turn that did real work. Claude skips the card when a plain reply is clearer.
- Follows light and dark mode, and works on phone widths.

Cards render in the Claude desktop app and claude.ai, where the `show_widget` tool is available. In a plain terminal, Claude falls back to a few coloured lines of text.

## Install

```
/plugin marketplace add timoconnellaus/session-card
/plugin install session-card@session-card
```

## How it works

Claude writes a short JSON spec and calls `show_widget` with:

```html
<div id="sc"></div>
<script src="https://cdn.jsdelivr.net/gh/timoconnellaus/session-card@v1.0.0/renderer.js" integrity="…" crossorigin="anonymous"></script>
<script>SessionCard.render('#sc', { summary: "…", blocks: [ … ] })</script>
```

`renderer.js` is served by jsDelivr from a version tag here. Widgets may only load scripts from a few CDNs, which is why it isn't self-hosted. The full block reference is in [skills/session-card/SKILL.md](skills/session-card/SKILL.md).

## Settings

- `SESSION_CARD_HOOK=0` turns the stop hook off and keeps the skill.
- `SESSION_CARD_MIN_TOOLS=5` sets how many tool calls in a turn count as real work (the default is 3; any file edit always counts).

## Developing

Open `gallery/index.html` through any static server (`python3 -m http.server`). It renders every example in `gallery/examples.js`, with buttons for dark mode and phone width.

To release, change `renderer.js` and bump `VERSION`. Tag `vX.Y.Z`, then update the URL and the `integrity` hash in the skill (`openssl dgst -sha384 -binary renderer.js | openssl base64 -A`). Then bump `.claude-plugin/plugin.json`. Old tags keep working, so cards drawn by older installs don't break.

## License

MIT
