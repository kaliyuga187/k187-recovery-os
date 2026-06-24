# Next Claude Code prompt for: nexus-frontend

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\Downloads\Projects\nexus-frontend

Goal:
Ship nexus-frontend to production.

Context:
nexus-frontend is a web-app project at 70/100 completion, 70/100 deploy readiness, 80/100 health. Stack: docker, docker-compose, drizzle, node, pnpm, typescript, vite, vitest. 

Current status:
- completion: 70/100
- deploy: 70/100
- health: 80/100
- last edit: 2026-06-24T02:57:07.248Z
- has git: false
- has readme: true
- has tests: true
- has docker: true
- has CI: false
- has deploy guide: true
- file count: 105

Required changes:
1. Initialize git, .gitignore, and a first commit
2. Add a GitHub Actions CI workflow
3. Document the final state in BUILD_REPORT.md

Files to inspect:
- `C:\Users\nk187\Downloads\Projects\nexus-frontend/README.md` (if exists)
- `C:\Users\nk187\Downloads\Projects\nexus-frontend/package.json` (if exists)
- `C:\Users\nk187\Downloads\Projects\nexus-frontend/Dockerfile` (if exists)

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
