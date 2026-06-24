# Next Claude Code prompt for: agent-pipeline

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\agent-pipeline

Goal:
Audit agent-pipeline, decide finish-or-archive, then execute that path.

Context:
agent-pipeline is a ai-agent project at 5/100 completion, 20/100 deploy readiness, 55/100 health. Stack: node, npm, python, vite. 

Current status:
- completion: 5/100
- deploy: 20/100
- health: 55/100
- last edit: 2026-04-27T12:08:05.371Z
- has git: false
- has readme: false
- has tests: false
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 11

Required changes:
1. Add a complete README with run + deploy instructions
2. Add at least one end-to-end test for the core flow
3. Initialize git, .gitignore, and a first commit

Files to inspect:
- `C:\Users\nk187\agent-pipeline/README.md` (if exists)
- `C:\Users\nk187\agent-pipeline/package.json` (if exists)
- `C:\Users\nk187\agent-pipeline/Dockerfile` (if exists)

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
