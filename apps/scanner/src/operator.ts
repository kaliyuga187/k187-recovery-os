import fs from "node:fs";
import path from "node:path";
import { prisma } from "@k187/db";
import type { Project } from "@k187/shared";
import { listProjects, listDuplicateGroups, getActiveBuild, findProjectBySlug } from "./reports.js";
import { analyzeLongContext } from "./analyze.js";
import { redactSecrets } from "@k187/shared";

/**
 * K187 .operator/ directory layout:
 *
 *   .operator/
 *     projects/<slug>/
 *       summary.md
 *       next-actions.md
 *       risks.md
 *       metadata.json
 *       build-status.md
 *       next-claude-code-prompt.md
 *       (if source=manus-export)  source.md, manus-recovery.md
 *       (if analysis ran)         long-analysis.md
 *     reports/
 *       operator-report.md
 *       manus-recovery-report.md
 *       duplicate-merge-plan.md
 *       focus-report.md
 *       hermes-skill-report.md
 *
 * All writers idempotent: safe to re-run.
 */

export function operatorRoot(): string {
  return path.resolve(process.cwd(), "..", "..", ".operator");
}

function safeWrite(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function safeWriteJson(file: string, obj: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

export function writeProjectMemory(p: Project): { files: string[] } {
  const dir = path.join(operatorRoot(), "projects", p.slug);
  const files: string[] = [];

  // metadata.json — redaction applied to description and path
  const meta = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    path: redactSecrets(p.path).text,
    source: p.source,
    category: p.category,
    stack: p.stack,
    description: p.description ? redactSecrets(p.description).text : null,
    sizeBytes: p.sizeBytes,
    fileCount: p.fileCount,
    hasGit: p.hasGit,
    hasReadme: p.hasReadme,
    hasEnv: p.hasEnv,
    hasTests: p.hasTests,
    hasDocker: p.hasDocker,
    hasCi: p.hasCi,
    hasDeployGuide: p.hasDeployGuide,
    hasBuildArtifacts: p.hasBuildArtifacts,
    lastModified: p.lastModified,
    firstSeen: p.firstSeen,
    completionScore: p.completionScore,
    deployScore: p.deployScore,
    healthScore: p.healthScore,
    compositeScore: p.compositeScore,
    status: p.status,
    tags: p.tags,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
  safeWriteJson(path.join(dir, "metadata.json"), meta);
  files.push("metadata.json");

  // summary.md
  safeWrite(
    path.join(dir, "summary.md"),
    [
      `# ${p.name}`,
      ``,
      `**Slug:** \`${p.slug}\`  `,
      `**Category:** \`${p.category}\`  `,
      `**Source:** \`${p.source}\`  `,
      `**Status:** \`${p.status}\``,
      ``,
      `## Scores`,
      ``,
      `| Metric | Value |`,
      `|---|---|`,
      `| Composite | ${p.compositeScore}/100 |`,
      `| Completion | ${p.completionScore}/100 |`,
      `| Deploy readiness | ${p.deployScore}/100 |`,
      `| Health | ${p.healthScore}/100 |`,
      ``,
      `## Stack`,
      ``,
      p.stack.length === 0 ? `_(none detected)_` : p.stack.map((s) => `- \`${s}\``).join("\n"),
      ``,
      `## Description`,
      ``,
      p.description ?? "_(no description found)_",
      ``,
      `## Path`,
      ``,
      `\`${p.path}\``,
      ``,
      `## Signals`,
      ``,
      `- git: ${p.hasGit ? "yes" : "no"}`,
      `- readme: ${p.hasReadme ? "yes" : "no"}`,
      `- tests: ${p.hasTests ? "yes" : "no"}`,
      `- docker: ${p.hasDocker ? "yes" : "no"}`,
      `- CI: ${p.hasCi ? "yes" : "no"}`,
      `- deploy guide: ${p.hasDeployGuide ? "yes" : "no"}`,
      `- build artifacts: ${p.hasBuildArtifacts ? "yes" : "no"}`,
      ``,
      `Last modified: ${p.lastModified ?? "unknown"}`,
      `File count: ${p.fileCount} · Size: ${formatBytes(p.sizeBytes)}`,
    ].join("\n") + "\n"
  );
  files.push("summary.md");

  // next-actions.md
  const actions = buildNextActions(p);
  safeWrite(
    path.join(dir, "next-actions.md"),
    [
      `# Next actions for ${p.name}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `## Immediate (do first)`,
      ...actions.immediate.map((a) => `1. ${a}`),
      ``,
      `## Soon (this session)`,
      ...actions.soon.map((a) => `1. ${a}`),
      ``,
      `## Later (this week)`,
      ...actions.later.map((a) => `1. ${a}`),
    ].join("\n") + "\n"
  );
  files.push("next-actions.md");

  // risks.md
  const risks = buildRisks(p);
  safeWrite(
    path.join(dir, "risks.md"),
    [
      `# Risks for ${p.name}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
      ``,
      ...risks.map((r) => `- **${r.title}** — ${r.detail}`),
      risks.length === 0 ? `- (no risks identified)` : "",
    ].join("\n") + "\n"
  );
  files.push("risks.md");

  // build-status.md
  safeWrite(
    path.join(dir, "build-status.md"),
    [
      `# Build status: ${p.name}`,
      ``,
      `Last verified: ${new Date().toISOString()}`,
      ``,
      `## Composite score: ${p.compositeScore}/100`,
      ``,
      `| Stage | Score |`,
      `|---|---|`,
      `| Completion | ${p.completionScore}/100 |`,
      `| Deploy | ${p.deployScore}/100 |`,
      `| Health | ${p.healthScore}/100 |`,
      ``,
      `## Status: \`${p.status}\``,
      ``,
      p.status === "complete"
        ? `✅ Marked complete. Move to deploy > monetize > expand.`
        : p.compositeScore >= 60
        ? `🟢 High composite. Strong candidate to focus on.`
        : p.compositeScore >= 30
        ? `🟡 Mid-composite. Needs more work before deploying.`
        : `🔴 Low composite. Likely needs a clean-up pass first.`,
    ].join("\n") + "\n"
  );
  files.push("build-status.md");

  // next-claude-code-prompt.md
  safeWrite(
    path.join(dir, "next-claude-code-prompt.md"),
    buildClaudeCodePrompt(p)
  );
  files.push("next-claude-code-prompt.md");

  // Manus-specific files
  if (p.source === "manus-export") {
    safeWrite(
      path.join(dir, "source.md"),
      [
        `# Source: ${p.name}`,
        ``,
        `This project was recovered from a **Manus export**.`,
        ``,
        `- Manus uuid: see \`manus-recovery.md\``,
        `- Original path (placeholder): \`${p.path}\``,
        ``,
        `## What to do`,
        ``,
        `1. Re-export the source files from Manus.`,
        `2. Save them to a real folder (e.g. \`~/Manus/${p.slug}/\`).`,
        `3. From \`k187-recovery-os\`, run:`,
        ``,
        `   \`\`\``,
        `   pnpm scan --path "~/Manus/${p.slug}"`,
        `   \`\`\``,
        ``,
        `4. This will overwrite the placeholder with real file counts and scores.`,
      ].join("\n") + "\n"
    );
    files.push("source.md");

    safeWrite(
      path.join(dir, "manus-recovery.md"),
      [
        `# Manus recovery: ${p.name}`,
        ``,
        `Generated: ${new Date().toISOString()}`,
        ``,
        `Manus is treated as a **source history**, not the final source of truth.`,
        `Local repo + GitHub is the final source of truth.`,
        ``,
        `## Status`,
        ``,
        `This is a **placeholder** record. No source files have been recovered yet.`,
        `Re-run \`pnpm scan --path <recovered-folder>\` once Manus source files are exported.`,
        ``,
        `## Operating rules`,
        ``,
        `- Do not depend on undocumented Manus APIs.`,
        `- Use the export directory (JSON files) as the only reliable input.`,
        `- For ZIP/tar.gz, extract first, then pass the directory.`,
      ].join("\n") + "\n"
    );
    files.push("manus-recovery.md");
  }

  return { files };
}

function buildNextActions(p: Project): { immediate: string[]; soon: string[]; later: string[] } {
  const immediate: string[] = [];
  const soon: string[] = [];
  const later: string[] = [];

  if (p.source === "manus-export" && p.fileCount === 0) {
    immediate.push("Export source files from Manus, save to `~/Manus/<slug>/`.");
    immediate.push("Re-run `pnpm scan --path <folder>` to overwrite this placeholder.");
  }
  if (!p.hasReadme) immediate.push("Add a README.md so others (and future-you) can pick this up.");
  if (!p.hasTests) immediate.push("Add at least one smoke test for the core flow.");
  if (!p.hasGit) immediate.push("`git init` + first commit. Git is the cheap, durable memory.");
  if (p.completionScore < 30) immediate.push("Run `pnpm analyze:long --project " + p.slug + "` for an LLM-generated action plan.");
  if (p.completionScore >= 30 && p.completionScore < 70) immediate.push("Finish the partial build. Read `next-claude-code-prompt.md` and hand it to Claude Code.");
  if (p.completionScore >= 70 && p.deployScore < 60) immediate.push("Add Docker + deploy script. This raises deploy-readiness dramatically.");
  if (p.completionScore >= 70 && p.deployScore >= 60) immediate.push("Ship it. Deploy, document, and decide monetize vs. expand.");

  if (!p.hasDocker && p.deployScore < 60) soon.push("Add a Dockerfile and `docker-compose.yml`.");
  if (!p.hasCi) soon.push("Add a `.github/workflows/ci.yml` for tests + lint on every push.");
  if (!p.hasDeployGuide) soon.push("Write a `DEPLOY.md` with the exact deploy steps.");
  if (p.stack.includes("vite") || p.stack.includes("nextjs")) soon.push("Confirm the production build still passes (`pnpm build`).");

  later.push("Add monitoring/logging once it's deployed.");
  later.push("Document any gotchas in the README.");
  later.push("Consider monetization only after it's stable in production.");

  if (immediate.length === 0) immediate.push("Pick the most useful next change and ship it.");
  return { immediate, soon, later };
}

function buildRisks(p: Project): Array<{ title: string; detail: string }> {
  const risks: Array<{ title: string; detail: string }> = [];
  if (!p.hasGit) risks.push({ title: "No git", detail: "Untracked work is one disk failure away from being lost." });
  if (!p.hasReadme) risks.push({ title: "No README", detail: "Hard for future-you (or anyone else) to pick this up." });
  if (!p.hasTests) risks.push({ title: "No tests", detail: "Refactors are risky; regressions are silent." });
  if (p.hasEnv && !p.hasDocker) risks.push({ title: "Has .env but no Docker", detail: "Secrets may be lying around in plaintext. Check that .env is gitignored and never committed." });
  if (p.sizeBytes > 500_000_000) risks.push({ title: "Bloated repo", detail: `Size is ${formatBytes(p.sizeBytes)}. Likely accidentally-committed artifacts. Run a .gitignore audit.` });
  if (p.lastModified) {
    const ageDays = (Date.now() - new Date(p.lastModified).getTime()) / 86_400_000;
    if (ageDays > 180) risks.push({ title: "Stale", detail: `Last edit ${Math.round(ageDays)} days ago. Dependencies are likely out of date and may not run on a fresh install.` });
  }
  if (p.source === "manus-export" && p.fileCount === 0) risks.push({ title: "Manus placeholder", detail: "No source files have been recovered yet. This row is metadata only." });
  return risks;
}

function buildClaudeCodePrompt(p: Project): string {
  return `# Next Claude Code prompt for: ${p.name}

Copy-paste this into Claude Code. Replace the placeholders in {{ }} with the real values from your environment.

\`\`\`
You are working in repo: ${p.path}

Goal:
${pickGoal(p)}

Context:
${p.name} is a ${p.category} project at ${p.completionScore}/100 completion, ${p.deployScore}/100 deploy readiness, ${p.healthScore}/100 health. Stack: ${p.stack.join(", ") || "unknown"}. ${
    p.description ? `Description: ${p.description}` : ""
  }

Current status:
- completion: ${p.completionScore}/100
- deploy: ${p.deployScore}/100
- health: ${p.healthScore}/100
- last edit: ${p.lastModified ?? "unknown"}
- has git: ${p.hasGit}
- has readme: ${p.hasReadme}
- has tests: ${p.hasTests}
- has docker: ${p.hasDocker}
- has CI: ${p.hasCi}
- has deploy guide: ${p.hasDeployGuide}
- file count: ${p.fileCount}

Required changes:
1. ${pickRequiredChange(p, 0)}
2. ${pickRequiredChange(p, 1)}
3. ${pickRequiredChange(p, 2)}

Files to inspect:
- \`${p.path}/README.md\` (if exists)
- \`${p.path}/package.json\` (if exists)
- \`${p.path}/Dockerfile\` (if exists)

Commands to run:
- \`pnpm install\`
- \`pnpm test\`
- \`pnpm build\`

Acceptance criteria:
- \`pnpm install\` completes without error
- \`pnpm test\` passes (or report clearly if no tests exist)
- \`pnpm build\` produces a deployable artifact
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
\`\`\`
`;
}

function pickGoal(p: Project): string {
  if (p.completionScore >= 70 && p.deployScore >= 60) return `Ship ${p.name} to production.`;
  if (p.completionScore >= 30) return `Finish the partially-built features in ${p.name}, then deploy.`;
  if (p.source === "manus-export") return `Recover ${p.name} from Manus source files, then continue the build.`;
  return `Audit ${p.name}, decide finish-or-archive, then execute that path.`;
}

function pickRequiredChange(p: Project, i: number): string {
  const list: string[] = [];
  if (!p.hasReadme) list.push("Add a complete README with run + deploy instructions");
  if (!p.hasTests) list.push("Add at least one end-to-end test for the core flow");
  if (!p.hasGit) list.push("Initialize git, .gitignore, and a first commit");
  if (!p.hasDocker) list.push("Add a Dockerfile + docker-compose.yml");
  if (!p.hasCi) list.push("Add a GitHub Actions CI workflow");
  if (p.completionScore < 50) list.push("Identify and complete the unfinished core features");
  if (p.deployScore < 60) list.push("Add a deploy script and document the deploy steps");
  if (p.healthScore < 50) list.push("Clean up the repo: remove dead code, update stale dependencies");
  list.push("Document the final state in BUILD_REPORT.md");
  return list[i] ?? list[list.length - 1];
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export async function writeAllProjectMemories(): Promise<{ count: number; files: string[] }> {
  const projects = await listProjects();
  const files: string[] = [];
  for (const p of projects) {
    const r = writeProjectMemory(p);
    files.push(...r.files);
  }
  return { count: projects.length, files };
}

export async function writeOperatorReport(): Promise<string> {
  const projects = await listProjects();
  const dups = await listDuplicateGroups();
  const active = await getActiveBuild();
  const out = path.join(operatorRoot(), "reports", "operator-report.md");

  const lines: string[] = [];
  lines.push(`# K187 Operator Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`## Totals`);
  lines.push(``);
  lines.push(`- Projects indexed: ${projects.length}`);
  lines.push(`- Duplicate groups: ${dups.length}`);
  lines.push(`- Average completion: ${projects.length ? Math.round(projects.reduce((s, p) => s + p.completionScore, 0) / projects.length) : 0}/100`);
  lines.push(`- Active build: ${active ? `\`${active.slug}\` (composite ${active.compositeScore}/100)` : "_(none)_"}`);
  lines.push(``);
  lines.push(`## All projects (sorted by composite score)`);
  lines.push(``);
  lines.push(`| Slug | Category | Composite | Comp. | Deploy | Health | Files | Source |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);
  for (const p of projects) {
    lines.push(`| \`${p.slug}\` | ${p.category} | **${p.compositeScore}** | ${p.completionScore} | ${p.deployScore} | ${p.healthScore} | ${p.fileCount} | ${p.source} |`);
  }
  lines.push(``);
  lines.push(`## Per-project memory`);
  lines.push(``);
  lines.push(`Each project has a \`summary.md\`, \`next-actions.md\`, \`risks.md\`, \`metadata.json\`, \`build-status.md\`, and \`next-claude-code-prompt.md\` under:`);
  lines.push(``);
  lines.push(`\`\`\``);
  lines.push(`.operator/projects/<slug>/`);
  lines.push(`\`\`\``);
  lines.push(``);
  lines.push(`Manus projects also have \`source.md\` and \`manus-recovery.md\`.`);

  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

export async function writeManusRecoveryReport(): Promise<string> {
  const projects = await listProjects();
  const manus = projects.filter((p) => p.source === "manus-export");
  const placeholders = manus.filter((p) => p.fileCount === 0);
  const recovered = manus.filter((p) => p.fileCount > 0);
  const out = path.join(operatorRoot(), "reports", "manus-recovery-report.md");

  const lines: string[] = [];
  lines.push(`# Manus Recovery Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`## Status`);
  lines.push(``);
  lines.push(`- Total Manus projects: ${manus.length}`);
  lines.push(`- Placeholders (no source files yet): ${placeholders.length}`);
  lines.push(`- Recovered (with source files): ${recovered.length}`);
  lines.push(``);
  lines.push(`## Operating rules`);
  lines.push(``);
  lines.push(`- Do not depend on undocumented Manus APIs.`);
  lines.push(`- Manus is a **source history**, not the final source of truth.`);
  lines.push(`- Local repo + GitHub is the final source of truth.`);
  lines.push(``);
  lines.push(`## Placeholders needing recovery`);
  lines.push(``);
  if (placeholders.length === 0) {
    lines.push(`None. All Manus projects have source files.`);
  } else {
    lines.push(`| Slug | Notes |`);
    lines.push(`|---|---|`);
    for (const p of placeholders) {
      lines.push(`| \`${p.slug}\` | Re-export from Manus, save to \`~/Manus/${p.slug}/\`, then \`pnpm scan --path <folder>\` |`);
    }
  }
  lines.push(``);
  lines.push(`## Already recovered`);
  lines.push(``);
  if (recovered.length === 0) {
    lines.push(`None yet.`);
  } else {
    lines.push(`| Slug | Files | Composite |`);
    lines.push(`|---|---|---|`);
    for (const p of recovered) {
      lines.push(`| \`${p.slug}\` | ${p.fileCount} | ${p.compositeScore} |`);
    }
  }

  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

export async function writeDuplicateMergePlan(): Promise<string> {
  const projects = await listProjects();
  const dups = await listDuplicateGroups();
  const out = path.join(operatorRoot(), "reports", "duplicate-merge-plan.md");

  const lines: string[] = [];
  lines.push(`# Duplicate Merge Plan`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`${dups.length} duplicate group(s) detected.`);
  lines.push(``);
  for (const g of dups) {
    lines.push(`## Group: \`${g.fingerprint.slice(0, 60)}\``);
    lines.push(``);
    lines.push(`**Recommendation:** keep \`${g.projects[0].slug}\`. Reason: ${g.reason}`);
    lines.push(``);
    lines.push(`| Slug | Path | Files | Action |`);
    lines.push(`|---|---|---|---|`);
    for (let i = 0; i < g.projects.length; i++) {
      const p = g.projects[i];
      const action = i === 0 ? "**KEEP**" : "archive candidate";
      lines.push(`| \`${p.slug}\` | \`${p.path}\` | ${p.fileCount} | ${action} |`);
    }
    lines.push(``);
  }

  if (dups.length === 0) {
    lines.push(`No duplicates detected. If you expected some, check:`);
    lines.push(``);
    lines.push(`1. Have you scanned both versions with \`pnpm scan --path <folder>\`?`);
    lines.push(`2. Do they share a name stem after stripping suffixes like \`(1)\`, \`git-only\`, \`extracted\`?`);
  }

  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

export async function writeFocusReport(): Promise<string> {
  const projects = await listProjects();
  const active = await getActiveBuild();
  const out = path.join(operatorRoot(), "reports", "focus-report.md");

  const top = projects.slice(0, 5);
  const stuck = projects
    .filter((p) => p.status === "active" && p.healthScore < 50)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  const lines: string[] = [];
  lines.push(`# Focus Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  if (active) {
    lines.push(`## Active build (Focus Lock)`);
    lines.push(``);
    lines.push(`- **Slug:** \`${active.slug}\``);
    lines.push(`- **Path:** \`${active.path}\``);
    lines.push(`- **Composite:** ${active.compositeScore}/100`);
    lines.push(`- **Status:** ${active.status}`);
    lines.push(``);
    lines.push(`**Do not start a new repo while this is active.** Finish, deploy, or explicitly park it.`);
  } else {
    lines.push(`## No active build set`);
    lines.push(``);
    lines.push(`Pick one from the top-5 below:`);
  }
  lines.push(``);
  lines.push(`## Top 5 most complete (recommended focus candidates)`);
  lines.push(``);
  lines.push(`| Rank | Slug | Composite | Action |`);
  lines.push(`|---|---|---|---|`);
  for (let i = 0; i < top.length; i++) {
    const p = top[i];
    const action = i === 0 ? "**PICK THIS**" : `or #${i + 1} candidate`;
    lines.push(`| ${i + 1} | \`${p.slug}\` | ${p.compositeScore} | ${action} |`);
  }
  lines.push(``);
  lines.push(`## Top 5 stuck (avoid touching these)`);
  lines.push(``);
  if (stuck.length === 0) {
    lines.push(`None detected.`);
  } else {
    lines.push(`| Slug | Health | Last edit |`);
    lines.push(`|---|---|---|`);
    for (const p of stuck) {
      lines.push(`| \`${p.slug}\` | ${p.healthScore} | ${p.lastModified?.slice(0, 10) ?? "?"} |`);
    }
  }
  lines.push(``);
  lines.push(`## CLI commands`);
  lines.push(``);
  lines.push(`\`\`\``);
  lines.push(`pnpm active:set --project <slug> --reason "..."`);
  lines.push(`pnpm active:show`);
  lines.push(`pnpm active:pause`);
  lines.push(`pnpm active:complete`);
  lines.push(`\`\`\``);

  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

export async function writeHermesSkillReport(): Promise<string> {
  const fs2 = await import("node:fs/promises");
  const path2 = await import("node:path");
  const os = await import("node:os");

  const skillsDir =
    process.env.HERMES_HOME
      ? path2.join(process.env.HERMES_HOME, "skills")
      : path2.join(os.homedir(), "AppData", "Local", "hermes", "skills");

  const expected = [
    "build-recovery",
    "manus-recovery",
    "adhd-build-assistant",
    "claude-code-delegator",
    "minimax-long-context-review",
    "weekly-build-report",
  ];

  const lines: string[] = [];
  lines.push(`# Hermes Skill Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`Target dir: \`${skillsDir}\``);
  lines.push(``);
  lines.push(`| Skill | Installed |`);
  lines.push(`|---|---|`);
  for (const s of expected) {
    const file = path2.join(skillsDir, s, "SKILL.md");
    let present = false;
    try {
      await fs2.access(file);
      present = true;
    } catch {
      present = false;
    }
    lines.push(`| \`${s}\` | ${present ? "yes" : "**missing**"} |`);
  }
  lines.push(``);
  lines.push(`## To install (or re-install) all 6 skills`);
  lines.push(``);
  lines.push(`\`\`\``);
  lines.push(`pnpm hermes:skills`);
  lines.push(`\`\`\``);

  const out = path.join(operatorRoot(), "reports", "hermes-skill-report.md");
  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

export async function writeAllOperatorReports(): Promise<{ reports: string[] }> {
  const reports: string[] = [];
  reports.push(await writeOperatorReport());
  reports.push(await writeManusRecoveryReport());
  reports.push(await writeDuplicateMergePlan());
  reports.push(await writeFocusReport());
  reports.push(await writeHermesSkillReport());
  return { reports };
}

export async function writeLongAnalysis(slug: string): Promise<string> {
  const p = await findProjectBySlug(slug);
  if (!p) throw new Error(`Project not found: ${slug}`);
  await analyzeLongContext({ slug });
  const analyses = await prisma.aIAnalysis.findMany({
    where: { projectId: p.id },
    orderBy: { generatedAt: "desc" },
    take: 1,
  });
  const a = analyses[0];
  const out = path.join(operatorRoot(), "projects", p.slug, "long-analysis.md");
  const lines: string[] = [];
  lines.push(`# Long-context analysis: ${p.name}`);
  lines.push(``);
  lines.push(`Generated: ${a?.generatedAt.toISOString() ?? new Date().toISOString()}`);
  lines.push(`Model: \`${a?.modelUsed ?? "unknown"}\``);
  lines.push(`Recommended action: **${a?.recommendedAction ?? "unknown"}**`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(a?.summary ?? "_(no summary)_");
  lines.push(``);
  if (a?.rationale) {
    lines.push(`## Rationale`);
    lines.push(``);
    lines.push(a.rationale);
    lines.push(``);
  }
  if (a) {
    const next: string[] = safeJsonArray(a.nextSteps);
    const risks: string[] = safeJsonArray(a.risks);
    if (next.length) {
      lines.push(`## Next steps`);
      lines.push(``);
      for (const s of next) lines.push(`1. ${s}`);
      lines.push(``);
    }
    if (risks.length) {
      lines.push(`## Risks`);
      lines.push(``);
      for (const r of risks) lines.push(`- ${r}`);
      lines.push(``);
    }
  }
  safeWrite(out, lines.join("\n") + "\n");
  return out;
}

function safeJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
