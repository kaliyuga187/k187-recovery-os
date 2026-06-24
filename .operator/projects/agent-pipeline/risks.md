# Risks for agent-pipeline

Generated: 2026-06-24T14:09:43.960Z

- **No git** — Untracked work is one disk failure away from being lost.
- **No README** — Hard for future-you (or anyone else) to pick this up.
- **No tests** — Refactors are risky; regressions are silent.
- **Has .env but no Docker** — Secrets may be lying around in plaintext. Check that .env is gitignored and never committed.

