# Manus recovery: next.js

Generated: 2026-06-24T14:09:44.010Z

Manus is treated as a **source history**, not the final source of truth.
Local repo + GitHub is the final source of truth.

## Status

This is a **placeholder** record. No source files have been recovered yet.
Re-run `pnpm scan --path <recovered-folder>` once Manus source files are exported.

## Operating rules

- Do not depend on undocumented Manus APIs.
- Use the export directory (JSON files) as the only reliable input.
- For ZIP/tar.gz, extract first, then pass the directory.
