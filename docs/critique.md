# Design critique, 2 October 2026

Three reviewers looked at the 20 example cards in `docs/examples/`:
- clarity at a glance (an ADHD lens)
- visual craft
- words, interaction and trust

Their findings are merged and ranked below. The number in brackets is how many of the three raised each one.

## Keep

- **The one-line header.** It shows the dot, the state word, the title, the project and the load on the right, and you can tell whose turn it is in about a second.
- **Lanes as single lines.** Your items get →, the done list folds behind ✓, and "Then Claude" gets ↳. Card 20 is the model card: lots of work, and still not overwhelming.
- **Checks, tracker, deploy and diff blocks.** They're calm and honest. "Not run" and "Stale" show in grey instead of being left out.
- **`cmd` plus "Done, it's set" for secrets.** The send preview also earns trust. Light mode and contrast hold up.

## Fix, ranked

1. **One state vocabulary, derived from the rules (3).**
   - About 11 banner words cover 5 colours, and some contradict the rules:
     - 04 shows "Blocked" when the user is the one who has to act.
     - 12 shows green "Wrapping up" while threads are still open.
     - 19 shows green "Moving along" while Claude is still working.
   - Banner words become a fixed set: Your turn, Blocked, Claude's on it, All done, Answered. The colour always follows the state. Green never appears with anything open.
2. **"Claude's on it" only when something is actually running (2).**
   - Once the turn ends, Claude has stopped. Cards 05, 08, 14, 15, 18 and 19 promise work that won't happen until the user replies.
   - Use `you` with a go button, unless a named background process (a deploy, CI) is running. Write in the third person, never "I'm fixing".
3. **The answer footer is the loudest thing, in the wrong colour (3).**
   - Solid green "Send answers" reads as "done". The cyan primary buttons elsewhere make the user's move look like Claude's.
   - Use one primary style in violet. Make Reset a quiet link. Fold the preview behind "Message preview".
   - Rename the button "Put in my reply", since it fills the message box rather than sending.
   - Drop ↗, which looks like an external link.
4. **Safe defaults (2).**
   - 10 could report every test as failed with one click. 17 sends "skipped". 16 starts with Approve selected.
   - Test checks get three states (works, broken, didn't try) and start unset. Required replies block sending until filled in. Don't pre-select approval for things that are hard to undo.
   - Any go or stop instruction shows on the card, not only in the preview.
5. **The right-hand meta always answers "what's on me?" (2).**
   - Use "N things · about X min", "X+ min" when an item has no estimate, or "Nothing needs you".
6. **One chip and tag family, and three type sizes (1).**
   - Git chips, pills, tags and "Recommended" are four different styles. Give them one base: 11px, radius 4, a hairline border, mono only for values.
   - Use 14px for titles, 13px for body and 11.5–12px for meta. Nothing goes below 11px.
   - Git chips go neutral grey, so "4 ahead" and "Clean" don't compete with a red check.
7. **Selected states you can see (2).**
   - "Park" shows no selection (12). The idle tint is invisible, and the selected option turns its whole explanation violet (03).
   - Add an inset border and a bolder weight to the selected item, give idle a real tint, and only tint the option's border and background.
8. **Say things once (1).**
   - 13 gives the count three times: in the meta, in the tiles and in the tags.
   - In 07, the "Now" line repeats the question, and "Safe to stop" sits next to an unanswered decision.
   - Avoid tiles and meta together, and drop "Now" when a question follows.
9. **Small affordances (2).**
   - "› show" reads as content. Make it a muted, dotted-underlined "show".
   - The effort dots are cramped and unexplained. Space them out and add "effort 2 of 3" as a title, or drop them.
   - On the phone, rows triple in height (13). Keep the tag and text on one line.
   - The rank arrows are heavy. Use borderless icons.
10. **Accessibility and consistency (1).**
    - Label every icon-only control with its item ("Move Email template up"), use aria-pressed on segments, and give × an undo.
    - Make question labels match the card text word for word. Join next steps with "then". Use "(as you suggested)".
    - Define the proof grades in SKILL.md.
    - SKILL.md still names the old amber, red and blue colours.
