import type { Project } from "./types.js";

/**
 * Completion score (0-100): how done the project looks.
 * Heuristics: docs + tests + deploy guide + git + structure + build artifacts.
 */
export function scoreCompletion(p: Pick<
  Project,
  | "hasReadme"
  | "hasTests"
  | "hasDocker"
  | "hasCi"
  | "hasDeployGuide"
  | "hasGit"
  | "hasBuildArtifacts"
  | "stack"
  | "fileCount"
>): number {
  let s = 0;
  if (p.hasReadme) s += 15;
  if (p.hasTests) s += 20;
  if (p.hasDocker) s += 10;
  if (p.hasCi) s += 10;
  if (p.hasDeployGuide) s += 10;
  if (p.hasGit) s += 10;
  if (p.hasBuildArtifacts) s += 10;
  if (p.stack.length > 0) s += 5;
  if (p.fileCount > 20) s += 5;
  if (p.fileCount > 100) s += 5;
  return Math.min(100, s);
}

/**
 * Deploy readiness (0-100): could this ship today with minimal work?
 * Penalizes missing infra. Rewards docker + ci + deploy guide.
 */
export function scoreDeployReadiness(p: Pick<
  Project,
  "hasDocker" | "hasCi" | "hasDeployGuide" | "hasEnv" | "hasBuildArtifacts" | "stack"
>): number {
  let s = 0;
  if (p.hasDocker) s += 30;
  if (p.hasCi) s += 20;
  if (p.hasDeployGuide) s += 20;
  if (p.hasEnv) s += 10;
  if (p.hasBuildArtifacts) s += 10;
  if (p.stack.some((s) => ["nextjs", "vite", "expo", "docker-compose"].includes(s))) s += 10;
  return Math.min(100, s);
}

/**
 * Health (0-100): is the repo in a healthy state, or abandoned / half-broken?
 * Penalizes missing git, no readme, no tests, lots of files but no structure.
 */
export function scoreHealth(p: Pick<
  Project,
  | "hasGit"
  | "hasReadme"
  | "hasTests"
  | "fileCount"
  | "stack"
  | "lastModified"
  | "sizeBytes"
>): number {
  let s = 50;
  if (p.hasGit) s += 15;
  if (p.hasReadme) s += 10;
  if (p.hasTests) s += 10;
  if (p.stack.length > 0) s += 5;
  if (p.fileCount > 200) s -= 10; // bloat signal
  if (p.lastModified) {
    const ageDays = (Date.now() - new Date(p.lastModified).getTime()) / 86_400_000;
    if (ageDays > 180) s -= 15;
    else if (ageDays < 30) s += 5;
  }
  if (p.sizeBytes > 500_000_000) s -= 20; // > 500MB is bloated
  return Math.max(0, Math.min(100, s));
}

/**
 * Composite: weighted blend used for "what to focus on first" sort.
 * Completion gets the heaviest weight.
 */
export function compositeScore(
  completion: number,
  deploy: number,
  health: number
): number {
  return Math.round(completion * 0.5 + deploy * 0.3 + health * 0.2);
}
