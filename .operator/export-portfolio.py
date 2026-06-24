#!/usr/bin/env python3
"""Export the 36 k187 projects + their MiniMax M3 layman's-terms summaries
to a JSON file the 123automateme-hub Next.js app can import.
Run from anywhere; writes to both the recovery-os .operator dir and the hub's src/data dir.
"""
import json
import sqlite3
import os
from pathlib import Path

ROOT = Path("C:/Users/nk187")
DB = ROOT / "k187-recovery-os" / "data" / "k187.db"
OP = ROOT / "k187-recovery-os" / ".operator" / "projects"
HUB_DATA = ROOT / "123automateme-hub" / "src" / "data"
HUB_DATA.mkdir(parents=True, exist_ok=True)

con = sqlite3.connect(str(DB))
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute("""
  SELECT slug, name, category, source, sizeBytes, fileCount, hasGit, hasReadme,
         hasEnv, hasTests, hasDocker, hasCi, hasDeployGuide, hasBuildArtifacts,
         completionScore, deployScore, healthScore, compositeScore, status, description
  FROM Project
  ORDER BY compositeScore DESC
""")

def short_summary(text, n=420):
    if not text: return ""
    t = text.strip()
    if len(t) <= n: return t
    cut = t[:n].rsplit(" ", 1)[0]
    return cut + "..."

projects = []
for row in cur.fetchall():
    slug = row["slug"]
    summary_path = OP / slug / "long-analysis.md"
    summary_text = ""
    if summary_path.exists():
        raw = summary_path.read_text(encoding="utf-8", errors="ignore")
        # Extract just the "## Summary" section's body, until the next "## "
        if "## Summary" in raw:
            start = raw.index("## Summary") + len("## Summary")
            rest = raw[start:].lstrip("\n")
            if "## " in rest:
                end = rest.index("## ")
                summary_text = short_summary(rest[:end].strip())
            else:
                summary_text = short_summary(rest.strip())
        # Detect heuristic fallback
        is_heuristic = "falling back to heuristic" in raw or "Could not parse structured JSON" in raw
    else:
        is_heuristic = True
    # Recommended action from the same file
    action = "unknown"
    if summary_path.exists():
        for line in raw.splitlines():
            if line.startswith("Recommended action:"):
                action = line.replace("Recommended action:", "").strip().replace("*", "")
                break
    # Stack
    cur.execute("SELECT stack FROM Project WHERE slug=?", (slug,))
    stack_str = cur.fetchone()["stack"] or "[]"
    try:
        stack = json.loads(stack_str)
    except Exception:
        stack = []
    # Source URL
    cur.execute("SELECT path FROM Project WHERE slug=?", (slug,))
    path = cur.fetchone()["path"]
    projects.append({
        "slug": slug,
        "name": row["name"] or slug,
        "category": row["category"] or "unknown",
        "source": row["source"],
        "path": path,
        "composite": row["compositeScore"],
        "completion": row["completionScore"],
        "deploy": row["deployScore"],
        "health": row["healthScore"],
        "fileCount": row["fileCount"],
        "hasGit": bool(row["hasGit"]),
        "hasDocker": bool(row["hasDocker"]),
        "hasTests": bool(row["hasTests"]),
        "hasReadme": bool(row["hasReadme"]),
        "hasDeployGuide": bool(row["hasDeployGuide"]),
        "hasCi": bool(row["hasCi"]),
        "stack": stack,
        "description": (row["description"] or "").strip(),
        "summary": summary_text,
        "action": action,
        "isHeuristic": is_heuristic,
        "status": row["status"],
    })

con.close()

# Stats
total = len(projects)
real_llm = sum(1 for p in projects if not p["isHeuristic"])
live = sum(1 for p in projects if p["source"] == "local" and p["composite"] >= 30)

# Order for the hub: top 6 first, then the rest by composite
top = [p for p in projects if p["composite"] >= 30 and p["slug"] != "manus" and not p["slug"].startswith("next")][:12]
rest = [p for p in projects if p not in top]

# Source mix
source_mix = {}
for p in projects:
    source_mix[p["source"]] = source_mix.get(p["source"], 0) + 1

# Category mix
cat_mix = {}
for p in projects:
    cat_mix[p["category"]] = cat_mix.get(p["category"], 0) + 1

# Action mix
action_mix = {}
for p in projects:
    action_mix[p["action"]] = action_mix.get(p["action"], 0) + 1

payload = {
    "generated": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    "totals": {
        "projects": total,
        "realLlmSummaries": real_llm,
        "liveHighScore": live,
        "sourceMix": source_mix,
        "categoryMix": cat_mix,
        "actionMix": action_mix,
    },
    "featured": top,
    "all": rest,
}

out = HUB_DATA / "portfolio-export.json"
out.write_text(json.dumps(payload, indent=2))
print(f"Wrote {out}")
print(f"  Total: {total} | Real LLM: {real_llm} | Live (composite>=30): {live}")
print(f"  Featured: {len(top)} | All: {len(rest)}")

# Also keep a copy in .operator for the recovery-os
op_copy = OP.parent / "portfolio-export.json"
op_copy.write_text(json.dumps(payload, indent=2))
print(f"  Copy at {op_copy}")
