# Next Claude Code prompt for: Code

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\Downloads\Code

Goal:
Audit Code, decide finish-or-archive, then execute that path.

Context:
Code is a infra project at 15/100 completion, 40/100 deploy readiness, 60/100 health. Stack: docker-compose. 

Current status:
- completion: 15/100
- deploy: 40/100
- health: 60/100
- last edit: 2026-05-31T08:19:34.813Z
- has git: false
- has readme: false
- has tests: false
- has docker: true
- has CI: false
- has deploy guide: false
- file count: 13

Required changes:
1. Add a complete README with run + deploy instructions
2. Add at least one end-to-end test for the core flow
3. Initialize git, .gitignore, and a first commit

Files to inspect:
- `C:\Users\nk187\Downloads\Code/README.md` (if exists)
- `C:\Users\nk187\Downloads\Code/package.json` (if exists)
- `C:\Users\nk187\Downloads\Code/Dockerfile` (if exists)

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
