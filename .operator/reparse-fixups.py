#!/usr/bin/env python3
"""Re-parse the raw LLM responses saved in analyze-fixup.log and rewrite
the 7 broken long-analysis.md files. The 3 that parsed correctly stay as-is.

The original fix-fallbacks.py parser failed because the model writes
fields like `recommendedAction` on one line and the value on the next
(no colon-on-same-line). This script reads the RAW block from the log,
parses with a more robust state machine, and rewrites the .md file.
"""
import os
import re
import json
import sqlite3
import time
from pathlib import Path

ROOT = Path("C:/Users/nk187/k187-recovery-os")
LOG = ROOT / ".operator" / "analyze-fixup.log"
OP = ROOT / ".operator" / "projects"
MODEL = "minimax/minimax-m3"

# 7 projects that the first parser mangled (the other 3 parsed correctly)
BAD_SLUGS = [
    "123automateme-hub",
    "apex-xepa-hub",
    "k",
    "kaio-cards",
    "manus-0e06e20d",
    "manus-3927e",
    "manus-a364c55a",
]

# Field detection: a line that is exactly (or starts with) one of the
# field names, possibly followed by ":", and then optionally a value.
FIELD_RE = re.compile(
    r"^\s*(summary|recommendedAction|rationale|nextSteps|risks)\s*:?\s*(.*)$",
    re.IGNORECASE,
)
BULLET_RE = re.compile(r"^\s*[-*]\s+(.*)$")

# A "no-content-after-field" state machine. As we walk lines, we track
# which field is "current". For text fields (summary, rationale, action),
# the value is collected as subsequent non-field, non-bullet lines.
# For list fields (nextSteps, risks), the value is collected as
# subsequent bullet lines.
TEXT_FIELDS = {"summary", "rationale", "recommendedaction"}
LIST_FIELDS = {"nextsteps", "risks"}
def parse(text: str) -> dict:
    # Strip ```json``` fences if the model wrapped its answer
    s = text.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*\n?", "", s)
        s = re.sub(r"\n?```\s*$", "", s)
    text = s.strip()
    # NB: keys are lowercase here because the flush() writes to out[cur]
    # where cur is the lowercased field name from the regex. The writer
    # uses these lowercase keys, so the camelCase aliases below make
    # the parsed dict shape consistent with the live API.
    out = {
        "summary": "",
        "recommendedaction": "unknown",
        "rationale": "",
        "nextsteps": [],
        "risks": [],
    }
    cur = None  # current field name in lowercase
    cur_kind = None  # 'text' or 'list'
    text_buf = []
    list_buf = []

    def flush():
        nonlocal cur, cur_kind, text_buf, list_buf
        if cur is None:
            return
        if cur_kind == "text":
            out[cur] = "\n".join(text_buf).strip()
        elif cur_kind == "list":
            out[cur] = [b.strip() for b in list_buf if b.strip()]
        cur = None
        cur_kind = None
        text_buf = []
        list_buf = []

    for line in text.splitlines():
        # blank line is a separator, doesn't change state
        if not line.strip():
            continue
        m = FIELD_RE.match(line)
        if m:
            flush()
            field = m.group(1).lower()
            value = m.group(2).strip()
            if field in TEXT_FIELDS:
                cur = field
                cur_kind = "text"
                text_buf = [value] if value else []
            elif field in LIST_FIELDS:
                cur = field
                cur_kind = "list"
                list_buf = [value] if value else []
            continue
        # bullet line
        bm = BULLET_RE.match(line)
        if bm:
            bullet = bm.group(1).strip()
            if cur_kind == "list":
                list_buf.append(bullet)
            elif cur_kind == "text":
                # treat bullet-inside-text as continuation
                text_buf.append(bullet)
            else:
                # bullet before any field — treat as nextSteps by default
                cur = "nextsteps"
                cur_kind = "list"
                list_buf = [bullet]
            continue
        # plain line: continuation of current text field
        if cur_kind == "text":
            text_buf.append(line.strip())
        elif cur_kind == "list":
            list_buf.append(line.strip())
        else:
            # orphan text before any field header — append to summary
            out["summary"] = (out["summary"] + " " + line.strip()).strip()

    flush()
    # Add camelCase aliases for ergonomic access by callers / writer
    out["recommendedAction"] = out["recommendedaction"]
    out["nextSteps"] = out["nextsteps"]
    return out

def write_long_analysis(slug: str, parsed: dict, generated_iso: str):
    p = OP / slug / "long-analysis.md"
    lines = [
        f"# Long-context analysis: {slug}",
        "",
        f"Generated: {generated_iso}",
        f"Model: `{MODEL}`",
        f"Recommended action: **{parsed['recommendedAction']}**",
        "",
        "## Summary",
        "",
        parsed["summary"] or "_(no summary)_",
        "",
    ]
    if parsed.get("rationale"):
        lines += ["## Rationale", "", parsed["rationale"], ""]
    if parsed.get("nextSteps"):
        lines += ["## Next steps", ""]
        for s in parsed["nextSteps"]:
            lines.append(f"1. {s}")
        lines.append("")
    if parsed.get("risks"):
        lines += ["## Risks", ""]
        for r in parsed["risks"]:
            lines.append(f"- {r}")
        lines.append("")
    p.write_text("\n".join(lines), encoding="utf-8")

def extract_raws(log_text: str) -> dict:
    """Pull the RAW block out of the log for each [N/10] section."""
    raws = {}
    # Walk the log line by line. Track current slug, accumulate raw.
    slug = None
    in_raw = False
    raw_buf = []
    for line in log_text.splitlines():
        # Detect section header
        m = re.match(r"=== \[\d+/10\] (\S+) at ", line)
        if m:
            slug = m.group(1)
            in_raw = False
            raw_buf = []
            continue
        if line.strip() == "RAW:":
            in_raw = True
            raw_buf = []
            continue
        if line.strip() == "---" and in_raw and slug:
            raws[slug] = "\n".join(raw_buf)
            in_raw = False
            slug = None
            raw_buf = []
            continue
        if in_raw:
            raw_buf.append(line)
    return raws

def main():
    log_text = LOG.read_text(encoding="utf-8", errors="ignore")
    raws = extract_raws(log_text)
    print(f"Extracted raw blocks for {len(raws)} projects")
    for slug, raw in raws.items():
        print(f"  {slug}: {len(raw)} chars")

    print()
    fixed = 0
    skipped = 0
    for slug in BAD_SLUGS:
        if slug not in raws:
            print(f"  SKIP {slug}: no RAW block in log")
            skipped += 1
            continue
        raw = raws[slug]
        parsed = parse(raw)
        # If parser still got nothing useful, fall back to the heuristic text
        if not parsed["summary"] and not parsed["rationale"] and not parsed["nextSteps"] and not parsed["risks"]:
            print(f"  WARN {slug}: parser produced no content, skipping")
            skipped += 1
            continue
        # Use the existing ISO timestamp from the file (so we don't drift)
        existing = (OP / slug / "long-analysis.md").read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"^Generated:\s*(\S+)", existing, re.MULTILINE)
        iso = m.group(1) if m else time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        write_long_analysis(slug, parsed, iso)
        print(f"  ✓ rewrote {slug}/long-analysis.md")
        print(f"      action={parsed['recommendedAction']!r}")
        print(f"      summary={len(parsed['summary'])}c, rationale={len(parsed['rationale'])}c, nextSteps={len(parsed['nextSteps'])}, risks={len(parsed['risks'])}")
        fixed += 1

    print(f"\nFixed: {fixed}, Skipped: {skipped}")

if __name__ == "__main__":
    main()
