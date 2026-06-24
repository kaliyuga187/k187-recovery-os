# Next Claude Code prompt for: next.js

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: manus://36586e47-18d5-4dd5-86c6-4d8568aecf46

Goal:
Recover next.js from Manus source files, then continue the build.

Context:
next.js is a unknown project at 5/100 completion, 0/100 deploy readiness, 20/100 health. Stack: manus. Description: Next.js framework development workspace

Current status:
- completion: 5/100
- deploy: 0/100
- health: 20/100
- last edit: unknown
- has git: false
- has readme: true
- has tests: false
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 0

Required changes:
1. Add at least one end-to-end test for the core flow
2. Initialize git, .gitignore, and a first commit
3. Add a Dockerfile + docker-compose.yml

Files to inspect:
- `manus://36586e47-18d5-4dd5-86c6-4d8568aecf46/README.md` (if exists)
- `manus://36586e47-18d5-4dd5-86c6-4d8568aecf46/package.json` (if exists)
- `manus://36586e47-18d5-4dd5-86c6-4d8568aecf46/Dockerfile` (if exists)

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
