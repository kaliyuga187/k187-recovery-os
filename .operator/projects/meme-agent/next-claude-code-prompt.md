# Next Claude Code prompt for: meme-agent

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: C:\Users\nk187\Downloads\Projects\meme-agent

Goal:
Finish the partially-built features in meme-agent, then deploy.

Context:
meme-agent is a ai-agent project at 45/100 completion, 10/100 deploy readiness, 80/100 health. Stack: drizzle, node, pnpm, typescript, vite, vitest. 

Current status:
- completion: 45/100
- deploy: 10/100
- health: 80/100
- last edit: 2026-05-29T18:04:13.181Z
- has git: false
- has readme: true
- has tests: true
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 69

Required changes:
1. Initialize git, .gitignore, and a first commit
2. Add a Dockerfile + docker-compose.yml
3. Add a GitHub Actions CI workflow

Files to inspect:
- `C:\Users\nk187\Downloads\Projects\meme-agent/README.md` (if exists)
- `C:\Users\nk187\Downloads\Projects\meme-agent/package.json` (if exists)
- `C:\Users\nk187\Downloads\Projects\meme-agent/Dockerfile` (if exists)

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
