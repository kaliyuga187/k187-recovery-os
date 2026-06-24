# AGENTS.md

> Conventions for AI agents (Claude Code, Codex, Copilot, etc.) working in this repo.

## Source of truth

- `data/k187.db` (SQLite, local) is the project registry.
- `.operator/projects/<slug>/` is the per-project memory.
- `.operator/reports/*.md` are the human-readable reports.
- `pnpm` is the package manager. **Never use npm or yarn.**
- `pnpm-workspace.yaml` defines the monorepo. Apps live in `apps/*`, shared code in `packages/*`.

## First 5 commands an agent should know

    pnpm install
    pnpm db:push
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build

All six must pass before a PR can land. **Do not** claim "done" until they do.

## Hard rules

- **Never read, store, print, report, or send to an AI provider:** `.env`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, `id_dsa`, `id_ecdsa`, `.npmrc`, `.pypirc`, `.netrc`, GitHub tokens, OpenAI/Anthropic/Stripe keys, bearer tokens, private key blocks, seed phrases, wallet secrets (incl. `wallet.dat`, `wallet.json`, `keystore.json`, `mnemonic.txt`, `mnemonic.json`, `*.b64`/`*.b64url`), passwords. The scanner explicitly skips these. The `redactSecrets()` helper strips them defensively before any LLM call.
- **Never run from the scanner or any K187 tool:** `rm`, `rmdir`, `del`, `Remove-Item`, `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`, `ssh`, `scp`, `rsync`, `sftp`, `git push`, `git remote add`, `git config --global`, `npm publish`, `pnpm publish`, `yarn publish`, `base64 -d`, `keytool`, `openssl req`. The `assertSafeCommand()` guard in `apps/scanner/src/security.ts` enforces this with regex; the only allowed subprocess invocations are `git clone --depth 1 <url> <dir>` and `powershell Expand-Archive`.
- **Always** ignore these directories when scanning or working: `node_modules`, `.git`, `.next`, `dist`, `build`, `coverage`, `.venv`, `__pycache__`, `target`, `vendor`.
- **Never** start a new repo if an existing one in `.operator/projects/` can be recovered, repaired, or completed. Run `pnpm report` first.
- **Never** commit secrets. The default `.gitignore` blocks `.env*` and `data/`; do not unblock them.
- **Prefer finish > polish > deploy > monetize > expand.** Don't start a new feature until the current build is at composite ≥ 70.

## Workflow for any new build work

1. `pnpm report` — read the current state.
2. `pnpm active:show` — confirm which build is active (Focus Lock).
3. Read `.operator/projects/<slug>/summary.md` and `next-actions.md`.
4. Read `.operator/projects/<slug>/next-claude-code-prompt.md` (already templated).
5. Make changes in the target repo (not in `k187-recovery-os`).
6. Re-run `pnpm scan --path <target>` to refresh scores.
7. Re-run `pnpm operator:snapshot` to update memory + reports.
8. If you finished a build, run `pnpm active:complete`.

## Coding style

- TypeScript everywhere. No JS files except `*.config.js` and `next.config.js` when required.
- ESM modules. Use `import`/`export`, not `require`.
- `tsx` for CLI scripts, `next` for the web app.
- Prefer `async/await`, never `.then()` chains in user-facing code.
- Errors are caught at command boundaries and reported via `chalk.red(...)`. Don't `process.exit(1)` from inside libraries.
- Comments explain WHY, not WHAT.

## File layout reminders

- `apps/scanner/src/` — CLI entrypoints and the data layer.
- `apps/web/src/app/` — Next.js 15 App Router pages.
- `packages/shared/src/` — pure functions (scoring, duplicate detection, redaction, slug). No Node-specific imports here.
- `packages/db/src/` — Prisma client + schema (one schema, many `prisma.project` queries).
- `packages/ai/src/` — provider-agnostic AI layer; add new providers in `provider.ts`.

## Tests

- Tests live next to source as `*.test.ts`.
- Run with `pnpm test` from the workspace root (currently runs the `@k187/shared` suite; add more suites as code grows).
- New code must come with tests for the non-trivial paths.

## When you finish

Always create `BUILD_REPORT.md` with: what changed, files touched, tests run, build result, remaining issues, next recommended action.
