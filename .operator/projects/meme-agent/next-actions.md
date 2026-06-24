# Next actions for meme-agent

Generated: 2026-06-24T14:09:43.925Z

## Immediate (do first)
1. `git init` + first commit. Git is the cheap, durable memory.
1. Finish the partial build. Read `next-claude-code-prompt.md` and hand it to Claude Code.

## Soon (this session)
1. Add a Dockerfile and `docker-compose.yml`.
1. Add a `.github/workflows/ci.yml` for tests + lint on every push.
1. Write a `DEPLOY.md` with the exact deploy steps.
1. Confirm the production build still passes (`pnpm build`).

## Later (this week)
1. Add monitoring/logging once it's deployed.
1. Document any gotchas in the README.
1. Consider monetization only after it's stable in production.
