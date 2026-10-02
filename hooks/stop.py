#!/usr/bin/env python3
"""Stop hook: when Claude has finished and is waiting on the user, nudge it once to show a
session card. It stays quiet while background work (agents, workflows, backgrounded commands)
is still running, because then Claude isn't really waiting on the user yet.

SESSION_CARD_HOOK=0 turns it off. It stays quiet in a plain terminal
(CLAUDE_CODE_ENTRYPOINT=cli) unless SESSION_CARD_TERMINAL=1. SESSION_CARD_MIN_TOOLS sets how many tool
calls a turn needs before the hook nudges (default 0: every turn).
"""
import json
import os
import re
import sys

EDIT_TOOLS = {"Edit", "Write", "NotebookEdit", "MultiEdit"}

REASON = (
    "Turn check (session-card): you've finished and the user is up next, but there's no session card. "
    "Load the session-card skill and show one now as the very last thing (information only, no "
    "buttons), with no text before it and then one line: Next: \"<the reply they'll most likely send>\". "
    "If you are actually still waiting on background work, don't show a card; just stop."
)

# Background launches whose results Claude would wait for. Long-running servers and watchers are
# left out: nobody waits on those to finish.
LAUNCH_MARKERS = ("running in background with ID", "moved to the background", "Async agent launched",
                  "workflow started", "Monitor started", "launched in the background")
NOT_WAITED_ON = re.compile(r"http\.server|\bserve\b|run dev|npm (run )?start|preview|--watch|\bwatch\b|tail -f|wrangler dev|vite", re.I)


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(text_of(b.get("content") if b.get("type") == "tool_result" else b.get("text", "")) for b in content if isinstance(b, dict))
    return ""


def pending_background(entries):
    """Tool-use ids of background work that was launched and hasn't reported back.

    Completion notices arrive as <task-notification> text in queued-message entries, naming the
    tool-use id, or (after an app restart) only the task id, so both are matched in the raw entries.
    """
    commands = {}
    launched = {}  # tool_use_id -> task id
    finished = set()
    for e in entries:
        content = (e.get("message") or {}).get("content")
        if e.get("type") == "assistant" and isinstance(content, list):
            for b in content:
                if isinstance(b, dict) and b.get("type") == "tool_use":
                    commands[b.get("id")] = json.dumps(b.get("input") or {})
        if e.get("type") == "user" and isinstance(content, list):
            for b in content:
                if isinstance(b, dict) and b.get("type") == "tool_result":
                    t = text_of(b.get("content"))
                    if any(m in t for m in LAUNCH_MARKERS):
                        m = re.search(r"(?:with ID|agentId|\(ID): ?([A-Za-z0-9_-]+)", t)
                        launched[b.get("tool_use_id")] = m.group(1) if m else None
        raw = json.dumps(e)
        if "task-notification" in raw:
            finished.update(re.findall(r"<tool-use-id>([^<\\]+)</tool-use-id>", raw))
            finished.update(re.findall(r"<task-id>([^<\\]+)</task-id>", raw))
    return {i for i, task in launched.items()
            if i not in finished and task not in finished and not NOT_WAITED_ON.search(commands.get(i, ""))}


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
        min_tools = int(os.environ.get("SESSION_CARD_MIN_TOOLS", "0"))
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
    if pending_background(entries):
        return  # still waiting on background work: Claude isn't waiting on the user yet
    if len(tools) < min_tools and not EDIT_TOOLS.intersection(tools):
        return  # quick turn: no nudge

    print(json.dumps({"decision": "block", "reason": REASON}))


if __name__ == "__main__":
    main()
