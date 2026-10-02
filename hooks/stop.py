#!/usr/bin/env python3
"""Stop hook: after a turn that did real work, nudge Claude once to consider
a session card. Claude may decline; the nudge never repeats in a turn.

SESSION_CARD_HOOK=0 turns it off. It stays quiet in a plain terminal
(CLAUDE_CODE_ENTRYPOINT=cli) unless SESSION_CARD_TERMINAL=1. SESSION_CARD_MIN_TOOLS sets how many tool
calls count as real work (default 3; any file edit always counts).
"""
import json
import os
import sys

EDIT_TOOLS = {"Edit", "Write", "NotebookEdit", "MultiEdit"}

REASON = (
    "Turn check (session-card): this turn did real work. If a status card would help the user "
    "see where the session stands (follow-ups, things for them to try or decide, a blocker, "
    "or a finished milestone), load the session-card skill and show one now as the very last thing, "
    "with no text before or after it. If it wouldn't help (the reply is a quick answer, a few commands, or a question "
    "for them), stop now and say nothing more."
)


def is_real_prompt(entry):
    if entry.get("type") != "user" or entry.get("isMeta"):
        return False
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        return not content.startswith("<")  # skip command and hook injections
    if isinstance(content, list):
        blocks = [b for b in content if isinstance(b, dict)]
        return any(b.get("type") == "text" for b in blocks) and not any(b.get("type") == "tool_result" for b in blocks)
    return False


def main():
    if os.environ.get("SESSION_CARD_HOOK") == "0":
        return
    # Cards need the desktop app, claude.ai or mobile; a plain terminal can't draw them.
    entry = os.environ.get("CLAUDE_CODE_ENTRYPOINT", "")
    if (not entry or entry == "cli") and os.environ.get("SESSION_CARD_TERMINAL") != "1":
        return
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    if data.get("stop_hook_active"):
        return
    path = data.get("transcript_path")
    if not path or not os.path.exists(path):
        return
    try:
        min_tools = int(os.environ.get("SESSION_CARD_MIN_TOOLS", "3"))
    except ValueError:
        min_tools = 3

    entries = []
    with open(path) as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except Exception:
                pass

    start = 0
    for i in range(len(entries) - 1, -1, -1):
        if is_real_prompt(entries[i]):
            start = i + 1
            break

    tools = []
    for e in entries[start:]:
        if e.get("type") != "assistant":
            continue
        for b in (e.get("message") or {}).get("content") or []:
            if isinstance(b, dict) and b.get("type") == "tool_use":
                tools.append(b.get("name", ""))

    if any("show_widget" in t for t in tools):
        return  # a card (or another widget) is already up this turn
    if len(tools) < min_tools and not EDIT_TOOLS.intersection(tools):
        return  # quick turn: no nudge

    print(json.dumps({"decision": "block", "reason": REASON}))


if __name__ == "__main__":
    main()
