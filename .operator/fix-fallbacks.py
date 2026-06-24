#!/usr/bin/env python3
"""Re-run the 10 fallback projects with a tighter prompt.
The original 36-call loop used the default analyzeLongContext() prompt,
which sometimes elicits ```json``` fenced output. The parser doesn't
unwrap those, so 10 projects got heuristic summaries even though
MiniMax M3 actually wrote real content (modelUsed = minimax/minimax-m3
in all 10 cases).

This script:
  1. Finds projects whose long-analysis.md contains the fallback marker
  2. For each, reads the raw AIAnalysis row's existing rawText (it WAS
     saved, just not parsed) — but the parser is in the analyze.ts code,
     not extractable here. So we re-call the API with a tighter prompt
     that explicitly forbids code fences.
  3. Writes the new long-analysis.md on top of the old one.
  4. Re-snapshots the operator reports.

Run from C:/Users/nk187/k187-recovery-os.
"""
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path("C:/Users/nk187/k187-recovery-os")
OP = ROOT / ".operator" / "projects"
SCANNER = ROOT / "apps" / "scanner"
LOG = ROOT / ".operator" / "analyze-fixup.log"
TSX_IMPORT = (
    "file:///C:/Users/nk187/k187-recovery-os/"
    "node_modules/.pnpm/tsx@4.19.2/"
    "node_modules/tsx/dist/esm/index.mjs"
)
ENV_FILE = ROOT / ".env"

# Tighter prompt override: we re-call the OpenRouter provider directly
# rather than going through analyze.ts, because we need the prompt to
# explicitly forbid markdown code fences. The existing CLI doesn't
# expose a prompt override flag.

# Instead, we just re-run with the existing CLI but with a slightly
# different input: we append a brief instruction note into the DB's
# `notes` field (which analyze.ts may pick up). But the simpler path
# is to just re-call the same loop and accept that the 10 will fall
# back again — because the issue is the model's response format, not
# the prompt.

# Even simpler: write a one-off fixup script that calls the OpenRouter
# API directly with an explicit prompt that says "respond in plain
# text, no JSON, no code fences", parses the response with a regex
# that unwraps ```json...``` if it slipped through, and writes the
# long-analysis.md directly. Bypasses the analyze.ts pipeline entirely
# for the fixup pass.

import urllib.request
import json
import sqlite3

API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Read the key from .env WITHOUT echoing it anywhere
_env = {}
for _line in ENV_FILE.read_text(encoding="utf-8", errors="ignore").splitlines():
    _line = _line.strip()
    if not _line or _line.startswith("#") or "=" not in _line:
        continue
    _k, _v = _line.split("=", 1)
    _env[_k.strip()] = _v.strip()
API_KEY = _env.get("OPENROUTER_API_KEY", "")
if not API_KEY:
    raise SystemExit("OPENROUTER_API_KEY not found in .env")
MODEL = "minimax/minimax-m3"

SYSTEM = """You are a portfolio analyst. For each project given, you produce a
short analysis with these fields:
  - summary: 2-3 sentences in plain English describing what the project is
  - recommendedAction: one of finish | polish | deploy | monetize | archive | ignore
  - rationale: 2-3 sentences explaining your recommendation
  - nextSteps: 3-5 bullet items (one short imperative sentence each)
  - risks: 2-4 bullet items (one short sentence each)

CRITICAL FORMATTING RULES:
- Respond in plain text. No markdown formatting of any kind.
- Do NOT wrap your response in ```json``` code fences.
- Do NOT use bold/italic/code/backtick syntax.
- Just write the fields as plain text with the field name on its own line,
  followed by the value, like this:

  summary: A short Pokémon TCG price lookup that runs without signup.
  recommendedAction: polish
  rationale: The core idea is sound and the Docker setup is in place, but
  tests and a deploy guide are missing.
  nextSteps:
  - Add a README and basic tests
  - Wire CI on GitHub
  - Ship to a cards subdomain
  risks:
  - No version control means one disk failure loses the work
  - hasEnv=true suggests possible on-disk secrets

This is the response format. Do not deviate."""

def call(prompt: str) -> str:
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {API_KEY}",
        "HTTP-Referer": "https://k187-recovery-os.local",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"]

def unwrap_fences(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        # Strip first line (```json or ```) and trailing ```
        s = re.sub(r"^```[a-zA-Z]*\s*\n?", "", s)
        s = re.sub(r"\n?```\s*$", "", s)
    return s.strip()

def parse(text: str) -> dict:
    text = unwrap_fences(text)
    out = {
        "summary": "",
        "recommendedAction": "unknown",
        "rationale": "",
        "nextSteps": [],
        "risks": [],
    }
    # split into sections by leading field name
    cur = None
    cur_list = None
    list_kind = None  # 'nextSteps' | 'risks'
    buf = []
    def flush_text():
        nonlocal cur, buf
        if cur is not None and buf:
            out[cur] = "\n".join(buf).strip()
        cur = None
        buf = []
    def flush_list():
        nonlocal cur_list, buf
        if cur_list is not None and buf:
            out[cur_list] = [b.strip().lstrip("-* ").strip() for b in buf if b.strip()]
        cur_list = None
        buf = []
    for line in text.splitlines():
        stripped = line.strip()
        m = re.match(r"^(summary|recommendedAction|rationale|nextSteps|risks)\s*:\s*(.*)$", stripped, re.IGNORECASE)
        if m:
            flush_text(); flush_list()
            field = m.group(1).lower()
            val = m.group(2).strip()
            if field in ("nextsteps",):
                cur_list = "nextSteps"
                if val: buf.append(val)
            elif field == "risks":
                cur_list = "risks"
                if val: buf.append(val)
            else:
                cur = field
                if val: buf.append(val)
            continue
        if not stripped:
            continue
        # bullet line
        if re.match(r"^[-*]\s+", stripped):
            stripped = re.sub(r"^[-*]\s+", "", stripped)
            if cur_list is not None:
                buf.append(stripped)
            elif cur is not None:
                # bullet inside a text field — concat to it
                buf.append(stripped)
            continue
        # continuation line
        if cur_list is not None:
            buf.append(stripped)
        elif cur is not None:
            buf.append(stripped)
    flush_text(); flush_list()
    return out

def get_fallback_slugs():
    out = []
    for d in sorted(os.listdir(OP)):
        p = OP / d / "long-analysis.md"
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="ignore")
            if "falling back to heuristic" in txt or "Could not parse structured JSON" in txt:
                out.append(d)
    return out

def load_project(slug: str) -> dict:
    con = sqlite3.connect(str(ROOT / "data" / "k187.db"))
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT * FROM Project WHERE slug=?", (slug,))
    row = cur.fetchone()
    con.close()
    if not row: return {}
    d = dict(row)
    try:
        d["stack"] = json.loads(d.get("stack") or "[]")
    except: d["stack"] = []
    return d

def build_prompt(p: dict) -> str:
    bits = []
    bits.append(f"Project name: {p.get('name') or p['slug']}")
    bits.append(f"Slug: {p['slug']}")
    bits.append(f"Category: {p.get('category') or 'unknown'}")
    bits.append(f"Source: {p.get('source') or 'local'}")
    if p.get("description"): bits.append(f"Description: {p['description']}")
    if p.get("path"): bits.append(f"Path on disk: {p['path']}")
    if p.get("stack"): bits.append(f"Stack: {', '.join(p['stack'])}")
    if p.get("fileCount"): bits.append(f"File count: {p['fileCount']}")
    if p.get("sizeBytes"): bits.append(f"Size: {p['sizeBytes']} bytes")
    if p.get("hasGit"): bits.append("Has git: yes")
    if p.get("hasDocker"): bits.append("Has Docker: yes")
    if p.get("hasTests"): bits.append("Has tests: yes")
    if p.get("hasReadme"): bits.append("Has README: yes")
    if p.get("hasCi"): bits.append("Has CI: yes")
    if p.get("hasDeployGuide"): bits.append("Has deploy guide: yes")
    bits.append(f"Scores: composite={p.get('compositeScore')}, completion={p.get('completionScore')}, deploy={p.get('deployScore')}, health={p.get('healthScore')}")
    return "\n".join(bits)

def write_long_analysis(slug: str, parsed: dict, raw: str):
    p = OP / slug / "long-analysis.md"
    lines = [
        f"# Long-context analysis: {slug}",
        "",
        f"Generated: {time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())}",
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

def main():
    log = open(LOG, "w", encoding="utf-8")
    fallback_slugs = get_fallback_slugs()
    print(f"Found {len(fallback_slugs)} fallback projects: {fallback_slugs}")
    log.write(f"Found {len(fallback_slugs)} fallback projects: {fallback_slugs}\n")
    log.flush()

    for i, slug in enumerate(fallback_slugs, 1):
        print(f"\n[{i}/{len(fallback_slugs)}] Re-analyzing {slug}...")
        log.write(f"\n=== [{i}/{len(fallback_slugs)}] {slug} at {time.strftime('%H:%M:%S')} ===\n")
        log.flush()
        proj = load_project(slug)
        if not proj:
            print(f"  SKIP: not in DB")
            log.write("  SKIP: not in DB\n")
            continue
        prompt = build_prompt(proj)
        t0 = time.time()
        try:
            raw = call(prompt)
        except Exception as e:
            print(f"  ERR: {e}")
            log.write(f"  ERR: {e}\n")
            continue
        dt = time.time() - t0
        log.write(f"  API call took {dt:.1f}s, response {len(raw)} chars\n")
        log.write(f"  RAW:\n{raw[:1500]}\n---\n")
        parsed = parse(raw)
        log.write(f"  PARSED: action={parsed['recommendedAction']} summary={len(parsed['summary'])}c nextSteps={len(parsed['nextSteps'])} risks={len(parsed['risks'])}\n")
        write_long_analysis(slug, parsed, raw)
        print(f"  ✓ wrote {slug}/long-analysis.md (action={parsed['recommendedAction']}, {dt:.1f}s)")

    log.write(f"\nDone at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    log.close()
    print(f"\nLog: {LOG}")

if __name__ == "__main__":
    main()
