# Next Claude Code prompt for: memory-extension

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\Downloads\Projects\memory-extension\memory-extension

Goal:
Audit memory-extension, decide finish-or-archive, then execute that path.

Context:
memory-extension is a trading-bot project at 15/100 completion, 0/100 deploy readiness, 65/100 health. Stack: unknown. 

Current status:
- completion: 15/100
- deploy: 0/100
- health: 65/100
- last edit: 2026-05-15T06:03:16.000Z
- has git: false
- has readme: true
- has tests: false
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 20

Required changes:
1. Add at least one end-to-end test for the core flow
2. Initialize git, .gitignore, and a first commit
3. Add a Dockerfile + docker-compose.yml

Files to inspect:
- `C:\Users\nk187\Downloads\Projects\memory-extension\memory-extension/README.md` (if exists)
- `C:\Users\nk187\Downloads\Projects\memory-extension\memory-extension/package.json` (if exists)
- `C:\Users\nk187\Downloads\Projects\memory-extension\memory-extension/Dockerfile` (if exists)

Commands to run:
- `pnpm install`
- `pnpm test`
- `pnpm build`

Acceptance criteria:
- `pnpm install` completes without error
- `pnpm test` passes (or report clearly if no tests exist)
- `pnpm build` produces a deployable artifact
- README.md has a "Run locally" section
- .env.example documents every required env var

Do not:
- Switch frameworks
- Rewrite from scratch
- Add new top-level dependencies without justification
- Commit .env files or secrets

Finish by creating BUILD_REPORT.md with:
- what changed
- files touched
- tests run + results
- build result
- remaining issues
- next recommended action
```
