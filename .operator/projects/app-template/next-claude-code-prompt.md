# Next Claude Code prompt for: app-template

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\nexus-ai-mobile

Goal:
Finish the partially-built features in app-template, then deploy.

Context:
app-template is a mobile-app project at 45/100 completion, 10/100 deploy readiness, 80/100 health. Stack: android, drizzle, expo, expo-eas, node, npm, pnpm, react-native, tailwind, typescript. 

Current status:
- completion: 45/100
- deploy: 10/100
- health: 80/100
- last edit: 2026-05-30T10:43:26.102Z
- has git: false
- has readme: true
- has tests: true
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 85

Required changes:
1. Initialize git, .gitignore, and a first commit
2. Add a Dockerfile + docker-compose.yml
3. Add a GitHub Actions CI workflow

Files to inspect:
- `C:\Users\nk187\nexus-ai-mobile/README.md` (if exists)
- `C:\Users\nk187\nexus-ai-mobile/package.json` (if exists)
- `C:\Users\nk187\nexus-ai-mobile/Dockerfile` (if exists)

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
