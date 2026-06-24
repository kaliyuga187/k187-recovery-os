# Next Claude Code prompt for: kaio-cards

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\kaio-cards

Goal:
Finish the partially-built features in kaio-cards, then deploy.

Context:
kaio-cards is a infra project at 30/100 completion, 40/100 deploy readiness, 70/100 health. Stack: docker, node, npm. Description: Free Pokémon TCG price lookup + trade analyzer. No signup, no tracking, no marketplace scraping.

Current status:
- completion: 30/100
- deploy: 40/100
- health: 70/100
- last edit: 2026-06-14T13:55:16.064Z
- has git: false
- has readme: true
- has tests: false
- has docker: true
- has CI: false
- has deploy guide: false
- file count: 18

Required changes:
1. Add at least one end-to-end test for the core flow
2. Initialize git, .gitignore, and a first commit
3. Add a GitHub Actions CI workflow

Files to inspect:
- `C:\Users\nk187\kaio-cards/README.md` (if exists)
- `C:\Users\nk187\kaio-cards/package.json` (if exists)
- `C:\Users\nk187\kaio-cards/Dockerfile` (if exists)

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
