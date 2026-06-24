# Next actions for Bots For Trading 

Generated: 2026-06-24T14:09:44.047Z

## Immediate (do first)
1. Export source files from Manus, save to `~/Manus/<slug>/`.
1. Re-run `pnpm scan --path <folder>` to overwrite this placeholder.
1. Add a README.md so others (and future-you) can pick this up.
1. Add at least one smoke test for the core flow.
1. `git init` + first commit. Git is the cheap, durable memory.
1. Run `pnpm analyze:long --project bots-for-trading` for an LLM-generated action plan.

## Soon (this session)
1. Add a Dockerfile and `docker-compose.yml`.
1. Add a `.github/workflows/ci.yml` for tests + lint on every push.
1. Write a `DEPLOY.md` with the exact deploy steps.

## Later (this week)
1. Add monitoring/logging once it's deployed.
1. Document any gotchas in the README.
1. Consider monetization only after it's stable in production.
