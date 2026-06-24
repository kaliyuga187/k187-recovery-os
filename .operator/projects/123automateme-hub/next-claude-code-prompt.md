# Next Claude Code prompt for: 123automateme-hub

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\123automateme-hub

Goal:
Finish the partially-built features in 123automateme-hub, then deploy.

Context:
123automateme-hub is a dashboard project at 65/100 completion, 70/100 deploy readiness, 80/100 health. Stack: docker, nextjs, node, pnpm, typescript, vitest. Description: Public landing page and client hub for 123automateme.com

Current status:
- completion: 65/100
- deploy: 70/100
- health: 80/100
- last edit: 2026-06-24T10:40:32.731Z
- has git: false
- has readme: true
- has tests: true
- has docker: true
- has CI: false
- has deploy guide: true
- file count: 30

Required changes:
1. Initialize git, .gitignore, and a first commit
2. Add a GitHub Actions CI workflow
3. Document the final state in BUILD_REPORT.md

Files to inspect:
- `C:\Users\nk187\123automateme-hub/README.md` (if exists)
- `C:\Users\nk187\123automateme-hub/package.json` (if exists)
- `C:\Users\nk187\123automateme-hub/Dockerfile` (if exists)

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
