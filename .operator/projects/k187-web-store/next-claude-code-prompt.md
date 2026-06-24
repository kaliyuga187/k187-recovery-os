# Next Claude Code prompt for: k187-web-store

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\Downloads\Projects\k187 web store

Goal:
Finish the partially-built features in k187-web-store, then deploy.

Context:
k187-web-store is a web-app project at 30/100 completion, 30/100 deploy readiness, 70/100 health. Stack: node, npm, vite. Description: K187 Bot Store — autonomous trading bots storefront

Current status:
- completion: 30/100
- deploy: 30/100
- health: 70/100
- last edit: 2026-05-31T07:33:40.156Z
- has git: false
- has readme: true
- has tests: false
- has docker: false
- has CI: false
- has deploy guide: true
- file count: 13

Required changes:
1. Add at least one end-to-end test for the core flow
2. Initialize git, .gitignore, and a first commit
3. Add a Dockerfile + docker-compose.yml

Files to inspect:
- `C:\Users\nk187\Downloads\Projects\k187 web store/README.md` (if exists)
- `C:\Users\nk187\Downloads\Projects\k187 web store/package.json` (if exists)
- `C:\Users\nk187\Downloads\Projects\k187 web store/Dockerfile` (if exists)

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
