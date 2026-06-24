# Next Claude Code prompt for: nextjs-project

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

```
You are working in repo: manus://25baa80e-cad2-457f-b386-e607ffcbc858

Goal:
Recover nextjs-project from Manus source files, then continue the build.

Context:
nextjs-project is a unknown project at 0/100 completion, 0/100 deploy readiness, 20/100 health. Stack: manus. 

Current status:
- completion: 0/100
- deploy: 0/100
- health: 20/100
- last edit: unknown
- has git: false
- has readme: false
- has tests: false
- has docker: false
- has CI: false
- has deploy guide: false
- file count: 0

Required changes:
1. Add a complete README with run + deploy instructions
2. Add at least one end-to-end test for the core flow
3. Initialize git, .gitignore, and a first commit

Files to inspect:
- `manus://25baa80e-cad2-457f-b386-e607ffcbc858/README.md` (if exists)
- `manus://25baa80e-cad2-457f-b386-e607ffcbc858/package.json` (if exists)
- `manus://25baa80e-cad2-457f-b386-e607ffcbc858/Dockerfile` (if exists)

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
