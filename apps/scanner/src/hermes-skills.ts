import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Generate the 6 K187 Hermes skills into the user's Hermes home:
 *   - build-recovery
 *   - manus-recovery
 *   - adhd-build-assistant
 *   - claude-code-delegator
 *   - minimax-long-context-review
 *   - weekly-build-report
 *
 * Idempotent: overwrites if present.
 */
export function hermesSkillsTargetDir(): string {
  // Allow override; default to Windows-side Hermes home (git-bash path).
  if (process.env.HERMES_HOME) return path.join(process.env.HERMES_HOME, "skills");
  return path.join(os.homedir(), "AppData", "Local", "hermes", "skills");
}

export function generateHermesSkills(targetDir?: string): string[] {
  const dir = targetDir ?? hermesSkillsTargetDir();
  fs.mkdirSync(dir, { recursive: true });

  const written: string[] = [];
  for (const skill of SKILLS) {
    const file = path.join(dir, skill.name, "SKILL.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, skill.body, "utf8");
    written.push(file);
  }
  return written;
}

const SKILLS: Array<{ name: string; body: string }> = [
  {
    name: "build-recovery",
    body: buildRecoverySkill(),
  },
  {
    name: "manus-recovery",
    body: manusRecoverySkill(),
  },
  {
    name: "adhd-build-assistant",
    body: adhdBuildAssistantSkill(),
  },
  {
    name: "claude-code-delegator",
    body: claudeCodeDelegatorSkill(),
  },
  {
    name: "minimax-long-context-review",
    body: minimaxLongContextReviewSkill(),
  },
  {
    name: "weekly-build-report",
    body: weeklyBuildReportSkill(),
  },
];

function buildRecoverySkill(): string {
  return `---
name: build-recovery
description: Recover, organize, compare, and complete scattered software builds. Triggers on "what now", "next", "what did we build", "what is closest to finished", "where is this running", "compare these projects", "continue building".
---

# build-recovery

When the user asks "what now", "next", "what did we build", "what is closest to finished", "where is this running", "compare these projects", or "continue building":

1. Run \`pnpm report\` in \`C:/Users/nk187/k187-recovery-os\` to read the latest project report.
2. Identify the most complete build (highest composite score, not a placeholder).
3. Identify duplicates (run \`pnpm compare:duplicates\` if not in the report).
4. Recommend ONE active build.
5. Generate ONE Claude Code prompt.
6. Tell the user what NOT to touch yet.

## Output format (use this exact shape)

\`\`\`
# Recommended focus
<slug>

# Why this one
<2-3 sentences>

# Current status
<completion>/100, <deploy>/100, <health>/100, status=<active|paused|complete|stuck>, path=<abs path>

# Next 3 actions
1. <one concrete action>
2. <one concrete action>
3. <one concrete action>

# Claude Code prompt
<fully-formed prompt using the delegator template>

# What not to touch yet
- <duplicates to ignore>
- <other projects to park>
\`\`\`

## Hard rules
- Never recommend a placeholder Manus project that has 0 files; tell the user to re-scan after export.
- Never start a new repo if an existing repo can be recovered.
- Always cite the source-of-truth path under C:/Users/nk187/k187-recovery-os.
`;
}

function manusRecoverySkill(): string {
  return `---
name: manus-recovery
description: Recover builds from a Manus export directory or ZIP. Triggers on "Manus", "previous Manus builds", "Manus hosting", "lost Manus apps", "exported Manus projects".
---

# manus-recovery

When the user mentions Manus, previous Manus builds, lost Manus apps, or exported Manus projects:

1. Tell the user to place exports in \`~/Manus\` or \`C:/Users/nk187/Manus\`.
2. From \`C:/Users/nk187/k187-recovery-os\` run ONE of:
   - \`pnpm import:manus --path "./manus-exports"\` (for an extracted directory)
   - \`pnpm import:manus --path "./export.json"\` (for a single JSON file)
   - ZIP/tar.gz: extract first, then pass the directory. (MVP limitation.)
3. Run \`pnpm report\` to see the imported placeholders.
4. For any placeholder the user wants to recover, ask them to also export the source files from Manus, then re-run \`pnpm scan --path "<recovered-folder>\` to overwrite the placeholder with real numbers.
5. Generate a Manus recovery report.
6. Generate a Claude Code continuation prompt.

## Rules
- Do NOT depend on undocumented Manus APIs. Treat exports as the only source.
- Manus is a SOURCE HISTORY, not the final source of truth.
- Local repo + GitHub is the final source of truth.

## Output format

\`\`\`
# Manus project recovered
<name> (uuid=<uuid>)

# Files found
<count> (from the JSON)

# Stack detected
<list, or "unknown — no source files recovered yet">

# What works
<bullets>

# What is missing
<bullets, including source files>

# Duplicate match
<slug> if any, else "no match in local DB"

# Claude Code continuation prompt
<delegator template>
\`\`\`
`;
}

function adhdBuildAssistantSkill(): string {
  return `---
name: adhd-build-assistant
description: Reduce context switching, forgotten steps, duplicate work, and unfinished build loops. Triggers on "next", "I'm confused", "where is this running", "keep building", "what should I do", "I forgot", "continue".
---

# adhd-build-assistant

When the user says "next", "I'm confused", "where is this running", "keep building", "what should I do", "I forgot", or "continue":

1. Identify the ACTIVE project (\`pnpm active:show\`).
2. Show where it lives (absolute path).
3. Show completion % (from the latest report).
4. Show the BLOCKER (last Claude Code BUILD_REPORT.md, or a one-line summary).
5. Give exactly ONE next action.
6. Tell the user what NOT to touch yet.
7. Generate ONE Claude Code prompt.

## Hard rules
- Do NOT give 20 options. One option.
- Do NOT encourage tool hopping.
- Do NOT start a new repo if an existing one can be repaired.
- Do NOT let the user rebuild the same thing under a new name.
- Order: finish > polish > deploy > monetize > expand.

## Output format

\`\`\`
# Current build
<slug>

# Where it is
<absolute path>

# Completion %
<n>/100

# Blocker
<one sentence>

# Do this next
<one concrete action>

# Do not do this yet
- <bullets>

# Claude Code prompt
<delegator template>
\`\`\`
`;
}

function claudeCodeDelegatorSkill(): string {
  return `---
name: claude-code-delegator
description: Generate exact, fully-formed Claude Code prompts for implementation work.
---

# claude-code-delegator

When the user needs implementation work (write, fix, test, deploy), generate ONE fully-formed Claude Code prompt using this exact template:

\`\`\`
You are working in repo: {{repoPath}}

Goal:
{{one-sentence goal}}

Context:
{{3-6 sentences: project summary, why it matters, what stage it's at}}

Current status:
- completion: {{n}}/100
- deploy: {{n}}/100
- health: {{n}}/100
- last edit: {{date or "unknown"}}
- last build: {{pass/fail/unknown}}

Required changes:
1. {{change}}
2. {{change}}
3. {{change}}

Files to inspect:
- {{path}}
- {{path}}

Commands to run:
- {{cmd}}
- {{cmd}}

Acceptance criteria:
- {{observable test}}
- {{observable test}}

Do not:
- {{do not touch X}}
- {{do not refactor Y}}

Finish by creating BUILD_REPORT.md with:
- what changed
- files touched
- tests run + results
- build result
- remaining issues
- next recommended action
\`\`\`

## Rules
- Never ask the user to fill in the template. Fill it in yourself from the latest report.
- Always include a repo path. Never say "TBD".
- Always include at least 2 acceptance criteria.
- Always include the BUILD_REPORT.md requirement.
`;
}

function minimaxLongContextReviewSkill(): string {
  return `---
name: minimax-long-context-review
description: Use MiniMax M3 for long-context analysis (project histories, duplicate repos, long reports, Manus exports, scattered build notes).
---

# minimax-long-context-review

Use MiniMax M3 for:
- Long project summaries
- Duplicate comparison
- Deciding the master version
- Manus recovery analysis
- Summarizing long histories
- Generating next Claude Code prompts

## Invocation
From \`C:/Users/nk187/k187-recovery-os\`:
- Single: \`pnpm analyze:long --project <slug>\`
- All:    \`pnpm analyze:long --all\`

Or via the dashboard: \`/ai-analysis\`.

## Hard rules
- DO NOT send .env files.
- DO NOT send API keys.
- DO NOT send seed phrases.
- DO NOT send private keys.
- DO NOT send wallet secrets.
- DO NOT send passwords.
- The provider redacts secrets before they leave the box, but the scanner also redacts on the way in. Defense in depth.
- Do NOT use MiniMax M3 for direct code editing. Claude Code remains the builder.

## Output format

\`\`\`
# Long-context findings
<summary>

# Best version
<slug> — <reason>

# Duplicate versions
<list of slugs>

# What to merge
<bullets>

# What to archive
<bullets>

# Next Claude Code prompt
<delegator template>
\`\`\`
`;
}

function weeklyBuildReportSkill(): string {
  return `---
name: weekly-build-report
description: Generate a weekly practical build report. Scans configured folders, imports Manus exports, generates a project report, compares duplicates, picks one build to focus on.
---

# weekly-build-report

## Workflow
1. \`pnpm scan --path <each configured folder>\`
2. \`pnpm import:manus --path "./manus-exports"\` if any
3. \`pnpm report\`
4. \`pnpm compare:duplicates\`
5. \`pnpm active:show\`
6. Generate a markdown report and write to \`C:/Users/nk187/k187-recovery-os/reports/weekly-YYYY-MM-DD.md\`.

## Output

\`\`\`
# Top 5 most complete builds
1. <slug> — <composite>/100
2. ...
3. ...
4. ...
5. ...

# Top 5 stuck builds
1. <slug> — health <n>/100, last edit <date>
2. ...

# Top 5 duplicates
1. <fingerprint> — <count> copies
2. ...

# One build to finish first
<slug> — <one-sentence reason>

# One build to ignore
<slug> — <one-sentence reason>

# Next Claude Code prompt
<delegator template>
\`\`\`

## Operating rule
Always check for an existing build first. Always prefer recover > organize > compare > finish.
`;
}
