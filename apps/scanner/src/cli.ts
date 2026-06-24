#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import fs from "node:fs";
import { prisma, ensureSchema } from "@k187/db";

import { scanRoot, buildProjectModel } from "./scanner.js";
import { importManus } from "./manus.js";
import {
  listProjects,
  listDuplicateGroups,
  generateWeeklyReport,
  getActiveBuild,
  setActiveBuild,
  pauseActiveBuild,
  completeActiveBuild,
  findProjectBySlug,
} from "./reports.js";
import { analyzeLongContext } from "./analyze.js";
import { generateHermesSkills, hermesSkillsTargetDir } from "./hermes-skills.js";
import { securitySelfTest } from "./security.js";
import {
  writeProjectMemory,
  writeAllProjectMemories,
  writeAllOperatorReports,
  writeOperatorReport,
  writeManusRecoveryReport,
  writeDuplicateMergePlan,
  writeFocusReport,
  writeHermesSkillReport,
  writeLongAnalysis,
  operatorRoot,
} from "./operator.js";

// Run security self-test at import time. If the BLOCKED / ALLOWED patterns
// don't compile, or the redact blacklist is incomplete, refuse to start.
securitySelfTest();

const program = new Command();
program
  .name("k187")
  .description("K187 Recovery OS — local-first build recovery CLI")
  .version("0.1.0");

function resolvePath(p: string): string {
  return path.resolve(process.cwd(), p);
}

program
  .command("scan")
  .description("Recursively scan a folder and index all detected projects")
  .requiredOption("--path <folder>", "Folder to scan (e.g. ./some-folder)")
  .option("--source <source>", "Source label (local|manus-export|github|zip|imported)", "local")
  .action(async (opts) => {
    await ensureSchema();
    const target = resolvePath(opts.path);
    if (!fs.existsSync(target)) {
      console.error(chalk.red(`Path not found: ${target}`));
      process.exit(1);
    }
    console.log(chalk.cyan(`Scanning ${target} ...`));
    const t0 = Date.now();
    const { projects, errors } = await scanRoot({ rootPath: target, source: opts.source });
    let inserted = 0;
    let updated = 0;
    for (const raw of projects) {
      const model = buildProjectModel(raw, opts.source);
      // Match by id first (id is sha1 of root — stable per directory).
      // Fall back to slug so a re-scan of a moved project still updates
      // the existing row instead of crashing on slug unique-constraint.
      const existing =
        (await prisma.project.findUnique({ where: { id: model.id } })) ??
        (await prisma.project.findUnique({ where: { slug: model.slug } }));
      if (!existing) {
        await prisma.project.create({
          data: {
            id: model.id,
            slug: model.slug,
            name: model.name,
            path: model.path,
            source: model.source,
            category: model.category,
            stack: JSON.stringify(model.stack),
            description: model.description,
            sizeBytes: model.sizeBytes,
            fileCount: model.fileCount,
            hasGit: model.hasGit,
            hasReadme: model.hasReadme,
            hasEnv: model.hasEnv,
            hasTests: model.hasTests,
            hasDocker: model.hasDocker,
            hasCi: model.hasCi,
            hasDeployGuide: model.hasDeployGuide,
            hasBuildArtifacts: model.hasBuildArtifacts,
            lastModified: model.lastModified ? new Date(model.lastModified) : null,
            completionScore: model.completionScore,
            deployScore: model.deployScore,
            healthScore: model.healthScore,
            compositeScore: model.compositeScore,
            status: model.status,
            notes: model.notes,
            tags: JSON.stringify(model.tags),
          },
        });
        inserted++;
      } else {
        await prisma.project.update({
          where: { id: existing.id },
          data: {
            id: model.id, // adopt new id if root changed
            name: model.name,
            path: model.path,
            category: model.category,
            stack: JSON.stringify(model.stack),
            description: model.description,
            sizeBytes: model.sizeBytes,
            fileCount: model.fileCount,
            hasGit: model.hasGit,
            hasReadme: model.hasReadme,
            hasEnv: model.hasEnv,
            hasTests: model.hasTests,
            hasDocker: model.hasDocker,
            hasCi: model.hasCi,
            hasDeployGuide: model.hasDeployGuide,
            hasBuildArtifacts: model.hasBuildArtifacts,
            lastModified: model.lastModified ? new Date(model.lastModified) : null,
            completionScore: model.completionScore,
            deployScore: model.deployScore,
            healthScore: model.healthScore,
            compositeScore: model.compositeScore,
          },
        });
        updated++;
      }
    }
    const ms = Date.now() - t0;
    console.log(chalk.green(`Done in ${ms}ms.`));
    console.log(`  Projects found: ${projects.length}`);
    console.log(`  Inserted:       ${inserted}`);
    console.log(`  Updated:        ${updated}`);
    if (errors.length) {
      console.log(chalk.yellow(`  Errors:         ${errors.length}`));
      for (const e of errors.slice(0, 10)) console.log(`    - ${e.path}: ${e.message}`);
    }
    await prisma.$disconnect();
  });

program
  .command("report")
  .description("Generate and print the latest project report")
  .action(async () => {
    await ensureSchema();
    const r = await generateWeeklyReport();
    console.log(chalk.bold("\n# K187 Recovery OS — Weekly Report"));
    console.log(chalk.gray(`Generated: ${r.generatedAt}\n`));

    console.log(chalk.bold("Totals"));
    console.log(`  Total projects:       ${r.totals.totalProjects}`);
    console.log(`  Duplicate groups:     ${r.totals.totalDuplicates}`);
    console.log(`  Avg completion:       ${r.totals.averageCompletion}/100`);
    console.log(`  Active build:         ${r.totals.activeBuild ? r.totals.activeBuild.slug : "(none)"}`);

    console.log(chalk.bold("\nTop 5 most complete"));
    for (const p of r.topComplete) {
      console.log(`  ${p.slug.padEnd(28)} composite=${p.compositeScore}  completion=${p.completionScore}  deploy=${p.deployScore}  health=${p.healthScore}`);
    }

    console.log(chalk.bold("\nTop 5 stuck"));
    for (const p of r.topStuck) {
      console.log(`  ${p.slug.padEnd(28)} health=${p.healthScore}  last=${p.lastModified ?? "?"}`);
    }

    console.log(chalk.bold("\nTop 5 duplicate groups"));
    for (const g of r.topDuplicates) {
      console.log(`  ${g.fingerprint.slice(0, 40).padEnd(42)} copies=${g.projects.length}`);
    }

    if (r.focusPick) {
      console.log(chalk.bold.green(`\nFocus pick: ${r.focusPick.slug} (composite=${r.focusPick.compositeScore})`));
    }
    if (r.ignorePick) {
      console.log(chalk.bold.red(`Ignore:     ${r.ignorePick.slug} (health=${r.ignorePick.healthScore})`));
    }

    // also write a markdown file
    const out = path.resolve(process.cwd(), "..", "..", "reports", `weekly-${new Date().toISOString().slice(0, 10)}.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, reportToMarkdown(r), "utf8");
    console.log(chalk.gray(`\nMarkdown report: ${out}`));

    await prisma.$disconnect();
  });

program
  .command("compare:duplicates")
  .description("Group projects by fingerprint and list duplicates")
  .action(async () => {
    await ensureSchema();
    const groups = await listDuplicateGroups();
    console.log(chalk.bold(`\n# Duplicate groups: ${groups.length}\n`));
    for (const g of groups) {
      console.log(chalk.cyan(`Group ${g.id}  fp=${g.fingerprint.slice(0, 60)}`));
      console.log(chalk.gray(`  reason: ${g.reason}`));
      for (const p of g.projects) {
        const tag = p.id === g.projects[0].id ? chalk.green("[keep]") : chalk.yellow("[archive]");
        console.log(`  ${tag} ${p.slug.padEnd(28)} ${p.path}`);
      }
      console.log();
    }
    await prisma.$disconnect();
  });

program
  .command("import:manus")
  .description("Import a Manus export directory, ZIP, or GitHub repo")
  .option("--path <p>", "Path to export dir, single .json file, or extracted archive")
  .option("--zip <file>", "Path to a .zip archive to extract via PowerShell Expand-Archive")
  .option("--github <url>", "GitHub repo URL to clone (shallow) and scan")
  .action(async (opts) => {
    await ensureSchema();
    if (!opts.path && !opts.zip && !opts.github) {
      console.error(chalk.red("Pass one of: --path <dir|file>, --zip <file>, or --github <url>"));
      process.exit(1);
    }
    if (opts.path) {
      const target = resolvePath(opts.path);
      if (!fs.existsSync(target)) {
        console.error(chalk.red(`Path not found: ${target}`));
        process.exit(1);
      }
      console.log(chalk.cyan(`Importing Manus export from ${target}...`));
      const r = await importManus({ path: target });
      await persistManusResults(r);
      console.log(chalk.green("Done."));
      console.log(`  Files processed:    ${r.totalFiles}`);
      console.log(`  Manus projects:     ${r.imported.length}`);
      console.log(`  Scanned projects:   ${r.scanned.length}`);
      console.log(`  Placeholders new:   ${r.placeholderProjects.length}`);
      if (r.errors.length) {
        console.log(chalk.yellow(`  Errors:             ${r.errors.length}`));
        for (const e of r.errors.slice(0, 10)) console.log(`    - ${e.file}: ${e.message}`);
      }
    } else if (opts.zip) {
      const target = resolvePath(opts.zip);
      if (!fs.existsSync(target)) {
        console.error(chalk.red(`Zip not found: ${target}`));
        process.exit(1);
      }
      console.log(chalk.cyan(`Importing from zip ${target}...`));
      const r = await importManus({ path: "", zip: target });
      await persistManusResults(r);
      console.log(chalk.green("Done."));
      console.log(`  Temp dir:           ${r.tempDirs[0] ?? "(none)"}`);
      console.log(`  Files processed:    ${r.totalFiles}`);
      console.log(`  Manus projects:     ${r.imported.length}`);
      console.log(`  Scanned projects:   ${r.scanned.length}`);
    } else if (opts.github) {
      console.log(chalk.cyan(`Importing from GitHub ${opts.github}...`));
      const r = await importManus({ path: "", github: opts.github });
      await persistManusResults(r);
      console.log(chalk.green("Done."));
      console.log(`  Temp dir:           ${r.tempDirs[0] ?? "(none)"}`);
      console.log(`  Files processed:    ${r.totalFiles}`);
      console.log(`  Scanned projects:   ${r.scanned.length}`);
    }
    await prisma.$disconnect();
  });

async function persistManusResults(r: Awaited<ReturnType<typeof importManus>>) {
  let inserted = 0;
  // placeholders from JSON metadata
  for (const p of r.placeholderProjects) {
    const existing = await prisma.project.findUnique({ where: { id: p.id } });
    if (!existing) {
      await prisma.project.create({
        data: {
          id: p.id, slug: p.slug, name: p.name, path: p.path, source: p.source,
          category: p.category, stack: JSON.stringify(p.stack), description: p.description,
          sizeBytes: p.sizeBytes, fileCount: p.fileCount,
          hasGit: p.hasGit, hasReadme: p.hasReadme, hasEnv: p.hasEnv,
          hasTests: p.hasTests, hasDocker: p.hasDocker, hasCi: p.hasCi,
          hasDeployGuide: p.hasDeployGuide, hasBuildArtifacts: p.hasBuildArtifacts,
          lastModified: p.lastModified ? new Date(p.lastModified) : null,
          completionScore: p.completionScore, deployScore: p.deployScore,
          healthScore: p.healthScore, compositeScore: p.compositeScore,
          status: p.status, notes: p.notes, tags: JSON.stringify(p.tags),
        },
      });
      inserted++;
    }
  }
  // real scanned projects (these overwrite placeholders with the same path)
  for (const p of r.scanned) {
    // Try to find an existing project with the same path first (overwrite case).
    const existingByPath = await prisma.project.findFirst({ where: { path: p.path } });
    if (existingByPath) {
      await prisma.project.update({
        where: { id: existingByPath.id },
        data: {
          name: p.name,
          slug: existingByPath.slug, // never rename on overwrite
          category: p.category,
          stack: JSON.stringify(p.stack),
          sizeBytes: p.sizeBytes,
          fileCount: p.fileCount,
          hasGit: p.hasGit, hasReadme: p.hasReadme, hasEnv: p.hasEnv,
          hasTests: p.hasTests, hasDocker: p.hasDocker, hasCi: p.hasCi,
          hasDeployGuide: p.hasDeployGuide, hasBuildArtifacts: p.hasBuildArtifacts,
          lastModified: p.lastModified ? new Date(p.lastModified) : null,
          completionScore: p.completionScore, deployScore: p.deployScore,
          healthScore: p.healthScore, compositeScore: p.compositeScore,
        },
      });
      continue;
    }
    // No existing project with this path. Try by id; if that conflicts on slug,
    // append a numeric suffix to make it unique.
    let slug = p.slug;
    let n = 1;
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${p.slug}-${n++}`;
    }
    const safe = { ...p, slug };
    await prisma.project.upsert({
      where: { id: safe.id },
      create: {
        id: safe.id, slug: safe.slug, name: safe.name, path: safe.path, source: safe.source,
        category: safe.category, stack: JSON.stringify(safe.stack), description: safe.description,
        sizeBytes: safe.sizeBytes, fileCount: safe.fileCount,
        hasGit: safe.hasGit, hasReadme: safe.hasReadme, hasEnv: safe.hasEnv,
        hasTests: safe.hasTests, hasDocker: safe.hasDocker, hasCi: safe.hasCi,
        hasDeployGuide: safe.hasDeployGuide, hasBuildArtifacts: safe.hasBuildArtifacts,
        lastModified: safe.lastModified ? new Date(safe.lastModified) : null,
        completionScore: safe.completionScore, deployScore: safe.deployScore,
        healthScore: safe.healthScore, compositeScore: safe.compositeScore,
        status: safe.status, notes: safe.notes, tags: JSON.stringify(safe.tags),
      },
      update: {},
    });
  }
  // tag the scanned project count for the caller
  return inserted + r.scanned.length;
}

program
  .command("analyze:long")
  .description("Use MiniMax M3 (or configured provider) to analyze project(s)")
  .option("--project <slug>", "Analyze a single project by slug")
  .option("--all", "Analyze every project")
  .action(async (opts) => {
    await ensureSchema();
    if (!opts.project && !opts.all) {
      console.error(chalk.red("Pass either --project <slug> or --all"));
      process.exit(1);
    }
    await analyzeLongContext({ slug: opts.project, all: !!opts.all });
    await prisma.$disconnect();
  });

const active = program.command("active").description("Manage the active build (Focus Lock)");
active
  .command("set")
  .requiredOption("--project <slug>", "Project slug to focus on")
  .option("--reason <r>", "Why this build?")
  .action(async (opts) => {
    await ensureSchema();
    const p = await findProjectBySlug(opts.project);
    if (!p) {
      console.error(chalk.red(`Project not found: ${opts.project}`));
      process.exit(1);
    }
    await setActiveBuild(p.id, opts.reason);
    console.log(chalk.green(`Active build set: ${p.slug}`));
    if (opts.reason) console.log(chalk.gray(`Reason: ${opts.reason}`));
    await prisma.$disconnect();
  });

active
  .command("show")
  .action(async () => {
    await ensureSchema();
    const p = await getActiveBuild();
    if (!p) console.log(chalk.yellow("No active build. Run: pnpm active:set --project <slug>"));
    else {
      console.log(chalk.green(`Active: ${p.slug}`));
      console.log(`  path:        ${p.path}`);
      console.log(`  completion:  ${p.completionScore}/100`);
      console.log(`  deploy:      ${p.deployScore}/100`);
      console.log(`  health:      ${p.healthScore}/100`);
      console.log(`  composite:   ${p.compositeScore}/100`);
    }
    await prisma.$disconnect();
  });

active
  .command("pause")
  .action(async () => {
    await ensureSchema();
    await pauseActiveBuild();
    console.log(chalk.yellow("Active build paused."));
    await prisma.$disconnect();
  });

active
  .command("complete")
  .action(async () => {
    await ensureSchema();
    await completeActiveBuild();
    console.log(chalk.green("Active build marked complete."));
    await prisma.$disconnect();
  });

program
  .command("hermes:skills")
  .description("Generate the 6 K187 Hermes skills into the local Hermes home")
  .action(async () => {
    const targetDir = hermesSkillsTargetDir();
    const written = generateHermesSkills(targetDir);
    console.log(chalk.green(`Wrote ${written.length} skills to ${targetDir}`));
    for (const f of written) console.log(`  - ${f}`);
  });

const op = program.command("operator").description("Generate .operator/ memory files and reports");
op
  .command("write")
  .description("Write per-project memory files for every project")
  .action(async () => {
    const r = await writeAllProjectMemories();
    console.log(chalk.green(`Wrote memory files for ${r.count} project(s).`));
    console.log(chalk.gray(`Root: ${operatorRoot()}`));
    await prisma.$disconnect();
  });
op
  .command("write-one")
  .requiredOption("--project <slug>", "Project slug")
  .action(async (opts) => {
    const p = await findProjectBySlug(opts.project);
    if (!p) {
      console.error(chalk.red(`Project not found: ${opts.project}`));
      process.exit(1);
    }
    const r = writeProjectMemory(p);
    console.log(chalk.green(`Wrote ${r.files.length} memory files for ${p.slug}.`));
    await prisma.$disconnect();
  });
op
  .command("reports")
  .description("Write all 5 required reports to .operator/reports/")
  .action(async () => {
    const r = await writeAllOperatorReports();
    console.log(chalk.green(`Wrote ${r.reports.length} report(s).`));
    for (const f of r.reports) console.log(`  - ${f}`);
    await prisma.$disconnect();
  });
op
  .command("report-operator")
  .description("Write only the main operator report")
  .action(async () => {
    const f = await writeOperatorReport();
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("report-manus")
  .description("Write the Manus recovery report")
  .action(async () => {
    const f = await writeManusRecoveryReport();
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("report-duplicates")
  .description("Write the duplicate merge plan")
  .action(async () => {
    const f = await writeDuplicateMergePlan();
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("report-focus")
  .description("Write the focus report")
  .action(async () => {
    const f = await writeFocusReport();
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("report-hermes")
  .description("Write the Hermes skill installation report")
  .action(async () => {
    const f = await writeHermesSkillReport();
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("analyze")
  .requiredOption("--project <slug>", "Project slug")
  .description("Run long-context analysis and write long-analysis.md")
  .action(async (opts) => {
    const f = await writeLongAnalysis(opts.project);
    console.log(chalk.green(f));
    await prisma.$disconnect();
  });
op
  .command("snapshot")
  .description("Write all per-project memory + all 5 reports (one-shot)")
  .action(async () => {
    const m = await writeAllProjectMemories();
    const r = await writeAllOperatorReports();
    console.log(chalk.green(`Snapshot complete: ${m.count} projects, ${r.reports.length} reports.`));
    console.log(chalk.gray(`Root: ${operatorRoot()}`));
    await prisma.$disconnect();
  });

function reportToMarkdown(r: import("@k187/shared").WeeklyReport): string {
  const lines: string[] = [];
  lines.push(`# K187 Recovery OS — Weekly Report`);
  lines.push(``);
  lines.push(`Generated: ${r.generatedAt}`);
  lines.push(``);
  lines.push(`## Totals`);
  lines.push(`- Total projects: ${r.totals.totalProjects}`);
  lines.push(`- Duplicate groups: ${r.totals.totalDuplicates}`);
  lines.push(`- Average completion: ${r.totals.averageCompletion}/100`);
  lines.push(`- Active build: ${r.totals.activeBuild ? r.totals.activeBuild.slug : "(none)"}`);
  lines.push(``);
  lines.push(`## Top 5 most complete`);
  for (const p of r.topComplete) lines.push(`- **${p.slug}** — composite=${p.compositeScore} completion=${p.completionScore} deploy=${p.deployScore} health=${p.healthScore} (${p.path})`);
  lines.push(``);
  lines.push(`## Top 5 stuck`);
  for (const p of r.topStuck) lines.push(`- **${p.slug}** — health=${p.healthScore} last=${p.lastModified ?? "?"} (${p.path})`);
  lines.push(``);
  lines.push(`## Top 5 duplicate groups`);
  for (const g of r.topDuplicates) {
    lines.push(`- \`${g.fingerprint.slice(0, 60)}\` — ${g.projects.length} copies`);
    for (const p of g.projects) lines.push(`    - ${p.slug}  ${p.path}`);
  }
  lines.push(``);
  if (r.focusPick) lines.push(`## Focus pick\n\n**${r.focusPick.slug}** (composite=${r.focusPick.compositeScore}) — ${r.focusPick.path}`);
  if (r.ignorePick) lines.push(`\n## Ignore\n\n**${r.ignorePick.slug}** (health=${r.ignorePick.healthScore}) — ${r.ignorePick.path}`);
  return lines.join("\n") + "\n";
}

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
