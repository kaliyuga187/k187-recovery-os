#!/usr/bin/env python3
"""Loop all 36 projects through MiniMax M3, one at a time, with proper logging."""
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path("C:/Users/nk187/k187-recovery-os")
SCANNER = ROOT / "apps" / "scanner"
SLUGS_FILE = ROOT / ".operator" / "analyze-slugs.txt"
LOG = ROOT / ".operator" / "analyze-loop.log"
TSX_IMPORT = "file:///C:/Users/nk187/k187-recovery-os/node_modules/.pnpm/tsx@4.19.2/node_modules/tsx/dist/esm/index.mjs"
ENV_FILE = ROOT / ".env"

slugs = [s.strip() for s in SLUGS_FILE.read_text().splitlines() if s.strip()]
print(f"Total slugs: {len(slugs)}")
log_f = open(LOG, "w", encoding="utf-8")
log_f.write(f"=== Starting analyze loop at {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
log_f.flush()

for i, slug in enumerate(slugs, 1):
    t0 = time.time()
    print(f"[{i}/{len(slugs)}] Analyzing {slug}...")
    log_f.write(f"\n=== [{i}/{len(slugs)}] Analyzing {slug} at {time.strftime('%H:%M:%S')} ===\n")
    log_f.flush()
    r = subprocess.run(
        ["node",
         f"--env-file={ENV_FILE}",
         f"--import={TSX_IMPORT}",
         "./src/cli.ts", "operator", "analyze",
         "--project", slug],
        cwd=str(SCANNER),
        capture_output=True, text=True, timeout=180
    )
    dt = time.time() - t0
    out = (r.stdout or "") + (r.stderr or "")
    log_f.write(f"--- exit={r.returncode} took={dt:.1f}s ---\n")
    log_f.write(out[-3000:] + "\n")
    log_f.flush()
    print(f"  exit={r.returncode} took={dt:.1f}s")
    if r.returncode != 0:
        print(f"  STDERR: {(r.stderr or '')[-500:]}")
        print(f"  STDOUT: {(r.stdout or '')[-500:]}")

log_f.write(f"\n=== Loop complete at {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
log_f.close()
print(f"\nDone. Log at {LOG}")
